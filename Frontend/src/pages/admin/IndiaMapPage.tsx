/**
 * India Map Page
 * Shows interactive map of India with states, districts, and sub-districts
 * Hierarchical navigation: India → State → District → Sub-district
 */

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { FeatureCollection } from "geojson";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Map as MapIcon } from "lucide-react";
import MapRenderHeatMap from "@/components/MapRenderHeatMap";
import { geoService } from "@/services/geo.service";
import { toast } from "sonner";

type MapLevel = "india" | "state" | "district" | "subdistrict";

interface BreadcrumbItem {
  level: MapLevel;
  name: string;
  code?: string;
}

const IndiaMapPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current navigation state from URL
  const stateCode = searchParams.get("state");
  const districtCode = searchParams.get("district");
  const subdistrictCode = searchParams.get("subdistrict");

  // Data states
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: "india", name: "India" },
  ]);
  const [currentLevel, setCurrentLevel] = useState<MapLevel>("india");

  /**
   * Determine current level based on URL parameters
   */
  useEffect(() => {
    const crumbs: BreadcrumbItem[] = [{ level: "india", name: "India" }];
    let level: MapLevel = "india";

    if (subdistrictCode && districtCode && stateCode) {
      level = "subdistrict";
      crumbs.push(
        { level: "state", name: stateCode, code: stateCode },
        { level: "district", name: districtCode, code: districtCode },
        { level: "subdistrict", name: subdistrictCode, code: subdistrictCode }
      );
    } else if (districtCode && stateCode) {
      level = "district";
      crumbs.push(
        { level: "state", name: stateCode, code: stateCode },
        { level: "district", name: districtCode, code: districtCode }
      );
    } else if (stateCode) {
      level = "state";
      crumbs.push({ level: "state", name: stateCode, code: stateCode });
    }

    setBreadcrumbs(crumbs);
    setCurrentLevel(level);
  }, [stateCode, districtCode, subdistrictCode]);

  /**
   * Load map data based on current level
   */
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: FeatureCollection;

        switch (currentLevel) {
          case "india":
            // Load all India states
            data = await geoService.getIndiaStatesGeoJson();
            break;

          case "state":
            // Load districts for selected state
            if (!stateCode) throw new Error("State code is required");
            data = await geoService.getStateDistrictsGeoJson(stateCode);
            break;

          case "district":
            // Load sub-districts for selected district
            if (!districtCode) throw new Error("District code is required");
            data = await geoService.getDistrictSubdistrictsGeoJson(districtCode);
            break;

          case "subdistrict":
            // Load villages/wards for selected sub-district
            if (!subdistrictCode) throw new Error("Sub-district code is required");
            data = await geoService.getSubdistrictVillagesGeoJson(subdistrictCode);
            break;

          default:
            throw new Error("Invalid map level");
        }

        setGeoData(data);
      } catch (err: any) {
        console.error("Error loading map data:", err);
        setError(err?.message || "Failed to load map data");
        toast.error(err?.message || "Failed to load map data");
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [currentLevel, stateCode, districtCode, subdistrictCode]);

  /**
   * Handle feature click - navigate deeper into hierarchy
   */
  const handleFeatureClick = useCallback(
    (feature: any) => {
      const properties = feature.properties;

      switch (currentLevel) {
        case "india":
          // Clicked on a state - navigate to state level
          const stateId = properties.ST_NM || properties.Name || properties.STATE || properties.state;
          if (stateId) {
            setSearchParams({ state: stateId });
          }
          break;

        case "state":
          // Clicked on a district - navigate to district level
          const districtId = properties.DISTRICT || properties.Name || properties.district || properties.dtname;
          if (districtId && stateCode) {
            setSearchParams({ state: stateCode, district: districtId });
          }
          break;

        case "district":
          // Clicked on a sub-district - navigate to sub-district level
          const subdistrictId =
            properties.sdtname || properties.SUBDISTRICT || properties.Name || properties.subdistrict;
          if (subdistrictId && stateCode && districtCode) {
            setSearchParams({
              state: stateCode,
              district: districtCode,
              subdistrict: subdistrictId,
            });
          }
          break;

        case "subdistrict":
          // Clicked on a village - show details
          const villageName = properties.name || properties.Name || properties.village || "Unknown";
          toast.info(`Village: ${villageName}`);
          break;
      }
    },
    [currentLevel, stateCode, districtCode, setSearchParams]
  );

  /**
   * Navigate back to a specific breadcrumb level
   */
  const handleBreadcrumbClick = useCallback(
    (item: BreadcrumbItem) => {
      switch (item.level) {
        case "india":
          setSearchParams({});
          break;
        case "state":
          if (item.code) {
            setSearchParams({ state: item.code });
          }
          break;
        case "district":
          if (stateCode && item.code) {
            setSearchParams({ state: stateCode, district: item.code });
          }
          break;
      }
    },
    [stateCode, setSearchParams]
  );

  /**
   * Navigate back one level
   */
  const handleGoBack = useCallback(() => {
    if (breadcrumbs.length > 1) {
      const previousLevel = breadcrumbs[breadcrumbs.length - 2];
      handleBreadcrumbClick(previousLevel);
    }
  }, [breadcrumbs, handleBreadcrumbClick]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">India Map</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Interactive hierarchical map navigation: States → Districts → Sub-districts
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {breadcrumbs.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={`${item.level}-${item.name}`}>
                  {index > 0 && <span className="text-muted-foreground">/</span>}
                  <button
                    onClick={() => handleBreadcrumbClick(item)}
                    disabled={index === breadcrumbs.length - 1}
                    className={`text-sm font-medium transition-colors ${
                      index === breadcrumbs.length - 1
                        ? "text-primary cursor-default"
                        : "text-muted-foreground hover:text-primary cursor-pointer"
                    }`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Level: {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Display */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map data...</p>
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive mb-2">Failed to load map</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && geoData && (
        <Card>
          <CardContent className="p-0">
            <div
              className="border rounded-lg overflow-hidden"
              style={{
                width: "100%",
                height: "700px",
                position: "relative",
                minHeight: "700px",
              }}
            >
              <MapRenderHeatMap
                geoData={geoData}
                onFeatureClick={handleFeatureClick}
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">How to Navigate:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Click on any{" "}
              {currentLevel === "india"
                ? "state"
                : currentLevel === "state"
                ? "district"
                : currentLevel === "district"
                ? "sub-district"
                : "village"}{" "}
              to drill down
            </li>
            <li>• Use the "Back" button or breadcrumbs to navigate up</li>
            <li>• Hover over regions to see details</li>
            <li>• Scroll to zoom, drag to pan</li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Info */}
      {!loading && !error && geoData && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm space-y-2">
              <div>
                <strong>Features Count:</strong> {geoData.features?.length || 0}
              </div>
              <div>
                <strong>Current Level:</strong> {currentLevel}
              </div>
              {geoData.features && geoData.features.length > 0 && (
                <div>
                  <strong>Sample Feature Properties:</strong>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(geoData.features[0].properties, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndiaMapPage;

