import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { HeatMap } from "../models/HeatMap";
import { Complaint } from "../models/Complaint";
import District from "../models/District";
import DistrictAdministrativeHead from "../models/DistrictAdministrativeHead";
import DemographicReligion from "../models/DemographicReligion";
import Demographics from "../models/Demographics";
import { sendSuccess } from "../utils/response";
import { NotFoundError } from "../utils/errors";
import logger from "../config/logger";

/**
 * Geo Controller
 * Handles geographic data operations
 */

/**
 * GET /api/v1/geo/uttarpradesh
 * Get Uttar Pradesh GeoJSON data
 */
export const getUPGeoJson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filePath = path.join(__dirname, "../../assets/UttarPradesh.geo.json");

    if (!fs.existsSync(filePath)) {
      throw new Error("Uttar Pradesh GeoJSON file not found");
    }

    const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    logger.info("Uttar Pradesh GeoJSON data fetched");

    sendSuccess(res, geoData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/badaun
 * Get Badaun district GeoJSON data
 */
export const getBadaunGeoJson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filePath = path.join(
      __dirname,
      "../../assets/districts/badaun/badaun.ervc.geojson"
    );

    if (!fs.existsSync(filePath)) {
      throw new Error("Badaun GeoJSON file not found");
    }

    const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    logger.info("Badaun GeoJSON data fetched");

    sendSuccess(res, geoData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/heatmap/districts
 * Get all districts with heat map values
 * Returns array of districts with districtCode, districtName, and heatValue
 */
export const getAllDistrictsHeatMap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Fetch all heat map entries, including totalComplaints for labels
    const districts = await HeatMap.find({})
      .select("districtCode districtName heatValue state totalComplaints")
      .lean()
      .sort({ districtName: 1 });

    // Transform to simplified format
    let districtsData = districts.map((district) => ({
      districtCode: district.districtCode,
      districtName: district.districtName,
      heatValue: district.heatValue,
      state: district.state || "Uttar Pradesh",
      totalComplaints: district.totalComplaints || 0, // Include totalComplaints for map labels
    }));

    // Check if Badaun/Budaun exists in heat map data
    const badaunInHeatMap = districtsData.find(
      (d) => d.districtCode.toLowerCase() === "badaun" || d.districtCode.toLowerCase() === "budaun"
    );

    // If Badaun is not in heat map, calculate from complaints
    if (!badaunInHeatMap) {
      try {
        const { Complaint } = await import("../models/Complaint");
        // Count all complaints for Badaun district (handles both spellings)
        const badaunComplaintCount = await Complaint.countDocuments({
          $or: [
            { district_name: "Badaun" },
            { district_name: "Budaun" },
          ],
        });

        // Add Badaun to the districts data
        districtsData.push({
          districtCode: "Badaun",
          districtName: "Badaun",
          heatValue: badaunComplaintCount, // Use complaint count as heat value
          state: "Uttar Pradesh",
          totalComplaints: badaunComplaintCount,
        });

        logger.info(
          `Added Badaun district with ${badaunComplaintCount} complaints (calculated from complaints collection)`
        );
      } catch (complaintError: any) {
        logger.warn(
          `Could not calculate Badaun complaints: ${complaintError.message}`
        );
        // Add Badaun with 0 complaints if calculation fails
        districtsData.push({
          districtCode: "Badaun",
          districtName: "Badaun",
          heatValue: 0,
          state: "Uttar Pradesh",
          totalComplaints: 0,
        });
      }
    } else {
      // If Badaun exists but totalComplaints is 0 or missing, recalculate
      if (!badaunInHeatMap.totalComplaints || badaunInHeatMap.totalComplaints === 0) {
        try {
          const { Complaint } = await import("../models/Complaint");
          const badaunComplaintCount = await Complaint.countDocuments({
            $or: [
              { district_name: "Badaun" },
              { district_name: "Budaun" },
            ],
          });

          // Update the existing entry
          const badaunIndex = districtsData.findIndex(
            (d) => d.districtCode.toLowerCase() === "badaun" || d.districtCode.toLowerCase() === "budaun"
          );
          if (badaunIndex !== -1) {
            districtsData[badaunIndex].totalComplaints = badaunComplaintCount;
            districtsData[badaunIndex].heatValue = badaunComplaintCount || districtsData[badaunIndex].heatValue;
          }

          logger.info(
            `Updated Badaun district with ${badaunComplaintCount} complaints (calculated from complaints collection)`
          );
        } catch (complaintError: any) {
          logger.warn(
            `Could not recalculate Badaun complaints: ${complaintError.message}`
          );
        }
      }
    }

    logger.info(
      `Fetched ${districtsData.length} districts with heat map values`
    );

    sendSuccess(res, {
      count: districtsData.length,
      districts: districtsData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/heatmap/:districtCode
 * Get complete heat map data for a specific district
 * Returns all heat map data associated with the districtCode
 */
export const getDistrictHeatMapById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { districtCode } = req.params;

    if (!districtCode) {
      throw new NotFoundError("District");
    }

    // Fetch complete heat map data for the district
    const heatMapData = await HeatMap.findOne({
      districtCode: districtCode,
    }).lean();

    if (!heatMapData) {
      throw new NotFoundError("District heat map data");
    }

    logger.info(`Fetched heat map data for district: ${districtCode}`);

    sendSuccess(res, heatMapData);
  } catch (error) {
    next(error);
  }
};

/**
 * Convert EsriJSON to GeoJSON FeatureCollection
 * Handles multiple formats:
 * 1. Direct GeoJSON FeatureCollection
 * 2. Nested array with FeatureCollection
 * 3. Elasticsearch format with _source
 */
const convertEsriJsonToGeoJson = (esriJsonData: any): any => {
  // If it's already a FeatureCollection, return it directly
  if (esriJsonData.type === 'FeatureCollection' && Array.isArray(esriJsonData.features)) {
    return esriJsonData;
  }

  const features: any[] = [];

  // Handle nested array structure (common in Esri/Elasticsearch exports)
  if (Array.isArray(esriJsonData)) {
    esriJsonData.forEach((outerItem: any) => {
      // Handle case where outer array contains FeatureCollection directly
      if (outerItem && outerItem.type === 'FeatureCollection' && Array.isArray(outerItem.features)) {
        features.push(...outerItem.features);
        return;
      }

      // Handle case where outer array contains arrays of items
      if (Array.isArray(outerItem)) {
        outerItem.forEach((item: any) => {
          // Handle nested FeatureCollection
          if (item && item.type === 'FeatureCollection' && Array.isArray(item.features)) {
            features.push(...item.features);
            return;
          }

          // Handle Elasticsearch _source format
          const source = item._source || item;
          
          if (source) {
            // Handle GeoJSON feature
            if (source.type === 'Feature' && source.geometry) {
              features.push({
                type: 'Feature',
                geometry: source.geometry,
                properties: {
                  ...source.properties,
                  name: source.properties?.Asset_Name || source.properties?.name || source.properties?.NAME || null,
                  Asset_Name: source.properties?.Asset_Name || null,
                  poiType: source.properties?.Type || null,
                  Type: source.properties?.Type || null,
                },
              });
              return;
            }

            // Handle direct geometry with coordinates
            if (source.geometry || (source.lat && source.long)) {
              const geometry = source.geometry || {
                type: 'Point',
                coordinates: [source.long, source.lat],
              };

              if (geometry.coordinates) {
                const properties = { ...source };
                delete properties.geometry;
                delete properties.lat;
                delete properties.long;

                features.push({
                  type: 'Feature',
                  geometry,
                  properties: {
                    ...properties,
                    name: properties.Asset_Name || properties.name || properties.NAME || null,
                    Asset_Name: properties.Asset_Name || null,
                    poiType: properties.Type || null,
                    Type: properties.Type || null,
                  },
                });
              }
            }
          }
        });
      }
      // Handle direct _source items
      else if (outerItem && outerItem._source) {
        const source = outerItem._source;
        if (source.geometry || (source.lat && source.long)) {
          const geometry = source.geometry || {
            type: 'Point',
            coordinates: [source.long, source.lat],
          };
          
          const properties = { ...source };
          delete properties.geometry;
          delete properties.lat;
          delete properties.long;

          features.push({
            type: 'Feature',
            geometry,
            properties: {
              ...properties,
              name: properties.Asset_Name || properties.name || properties.NAME || null,
              Asset_Name: properties.Asset_Name || null,
              poiType: properties.Type || null,
              Type: properties.Type || null,
            },
          });
        }
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features: features,
  };
};

/**
 * GET /api/v1/geo/:district/:poi
 * Get Points of Interest (POI) data for a specific district
 * 
 * @param district - District name (e.g., "badaun")
 * @param poi - POI type (e.g., "adhq" or "india-assets")
 * 
 * Returns GeoJSON FeatureCollection of POI locations
 */
export const getDistrictPOI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { district, poi } = req.params;

    if (!district || !poi) {
      throw new NotFoundError("District or POI type");
    }

    // Normalize district name to lowercase for file path
    const districtLower = district.toLowerCase();

    // Validate POI type
    const validPOITypes = ["adhq", "india-assets"];
    if (!validPOITypes.includes(poi.toLowerCase())) {
      throw new NotFoundError(
        `POI type. Valid types: ${validPOITypes.join(", ")}`
      );
    }

    // Construct file path based on POI type
    let fileName: string;
    if (poi.toLowerCase() === "adhq") {
      fileName = "adhq.esri.json";
    } else if (poi.toLowerCase() === "india-assets") {
      fileName = "indiaAssets.esri.json";
    } else {
      throw new NotFoundError("POI type");
    }

    const filePath = path.join(
      __dirname,
      "../../assets/districts",
      districtLower,
      poi.toLowerCase() === "india-assets" ? "india-assets" : "adhq",
      fileName
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(
        `POI data file for ${district}/${poi}`
      );
    }

    // Read and parse EsriJSON file
    const esriJsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Convert EsriJSON to GeoJSON FeatureCollection
    const geoJsonData = convertEsriJsonToGeoJson(esriJsonData);

    logger.info(
      `Fetched ${geoJsonData.features.length} POI features for ${district}/${poi}`
    );

    sendSuccess(res, geoJsonData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/districts/:districtCode/hover-summary
 * Get lightweight district data for hover tooltip
 * Returns administrative heads, complaint stats, and basic demographics
 */
export const getDistrictHoverSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { districtCode } = req.params;

    if (!districtCode) {
      throw new NotFoundError("District code");
    }

    // Normalize district code (handle Badaun/Budaun variations)
    const normalizedCode = districtCode.toLowerCase();
    const districtName = normalizedCode === "badaun" || normalizedCode === "budaun" 
      ? "Budaun" 
      : districtCode;

    // Fetch district info
    const district = await District.findOne({
      $or: [
        { districtName: new RegExp(`^${districtName}$`, "i") },
        { districtLgd: !isNaN(Number(districtCode)) ? Number(districtCode) : -1 }
      ]
    }).lean();

    // Fetch complaint statistics
    const complaints = await Complaint.find({
      district_name: new RegExp(`^${districtName}$`, "i")
    }).lean();

    const pendingComplaints = complaints.filter(c => c.status === "pending").length;
    const inProgressComplaints = complaints.filter(c => c.status === "in_progress").length;
    const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;

    // Fetch administrative heads
    let mlcName: string | undefined;
    let mpName: string | undefined;
    let zilaPanchayatHead: string | undefined;
    let iasName: string | undefined;

    if (district) {
      const adminHead = await DistrictAdministrativeHead.findOne({
        district: district._id
      }).lean();

      if (adminHead) {
        // Extract MLC name
        if (adminHead.legislative_authorities?.member_of_legislative_council_MLC?.[0]) {
          mlcName = adminHead.legislative_authorities.member_of_legislative_council_MLC[0].name;
        }

        // Extract MP name (first MLA as representative)
        if (adminHead.legislative_authorities?.members_of_legislative_assembly_MLA?.[0]) {
          mpName = adminHead.legislative_authorities.members_of_legislative_assembly_MLA[0].name;
        }

        // Extract Zila Panchayat head
        if (adminHead.legislative_authorities?.local_body_heads?.[0]) {
          zilaPanchayatHead = adminHead.legislative_authorities.local_body_heads[0].name;
        }

        // Extract IAS/DM name
        if (adminHead.executive_authorities?.general_administration?.[0]) {
          iasName = adminHead.executive_authorities.general_administration[0].name;
        }
      }
    }

    // Fetch demographics (religion-based population)
    let population = district?.population || 0;
    let hinduPopulation: number | undefined;
    let muslimPopulation: number | undefined;

    if (district) {
      const demographics = await DemographicReligion.findOne({
        district: district._id
      }).lean();

      if (demographics?.district_stats?.Total) {
        population = demographics.district_stats.Total.population?.persons || population;
        hinduPopulation = demographics.district_stats.Total.religion?.hindu?.persons;
        muslimPopulation = demographics.district_stats.Total.religion?.muslim?.persons;
      }
    }

    const hoverData = {
      districtName: district?.districtName || districtCode,
      districtCode: districtCode,
      mlcName,
      mpName,
      zilaPanchayatHead,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      iasName,
      population,
      hinduPopulation,
      muslimPopulation,
    };

    logger.info(`Returned hover summary for district: ${districtCode}`);
    sendSuccess(res, hoverData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/subdistricts/:subdistrictCode/hover-summary
 * Get lightweight subdistrict data for hover tooltip
 */
export const getSubdistrictHoverSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subdistrictCode } = req.params;

    if (!subdistrictCode) {
      throw new NotFoundError("Subdistrict code");
    }

    // Fetch complaints for this subdistrict
    const complaints = await Complaint.find({
      subdistrict_name: new RegExp(`^${subdistrictCode}$`, "i")
    }).lean();

    const pendingComplaints = complaints.filter(c => c.status === "pending").length;
    const inProgressComplaints = complaints.filter(c => c.status === "in_progress").length;
    const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;

    // Map subdistrict names to LGD codes (for Badaun district)
    const subdistrictLgdMap: { [key: string]: number } = {
      Bilsi: 780,
      Bisauli: 779,
      Budaun: 782,
      Badaun: 782,
      Dataganj: 783,
      Sahaswan: 781,
      Gunnaur: 778,
    };

    let population = 0;
    let hinduPopulation: number | undefined;
    let muslimPopulation: number | undefined;
    let bdoName: string | undefined;
    let blockPramukh: string | undefined;

    // Try to get LGD code from name, fallback to parsing as number
    const subdistrictLgd = subdistrictLgdMap[subdistrictCode] || parseInt(subdistrictCode);

    if (!isNaN(subdistrictLgd)) {
      // Fetch basic demographics (total population)
      const demographics = await Demographics.findOne({
        level: "subdistrict",
        subdistrictLgd: subdistrictLgd,
        residence: "total"
      }).lean();

      if (demographics) {
        population = demographics.totalPopulation || 0;
      }

      // Fetch religion-based demographics for Hindu/Muslim population
      // First, get the District document to access its _id (just like district-level does)
      const districtLgd = 134; // Budaun district LGD
      
      const district = await District.findOne({ districtLgd: districtLgd }).lean();

      if (district) {
        const religionData = await DemographicReligion.findOne({
          district: district._id  // ✅ Use ObjectId reference (same as district-level)
        }).lean();

        if (religionData && religionData.sub_districts) {
          // Find the matching subdistrict in the religion data
          const subdistrictData = religionData.sub_districts.find(
            (sd: any) => 
              sd.code === subdistrictLgd.toString() || 
              sd.name?.toLowerCase() === subdistrictCode.toLowerCase()
          );

          if (subdistrictData && subdistrictData.stats?.Total) {
            hinduPopulation = subdistrictData.stats.Total.religion?.hindu?.persons;
            muslimPopulation = subdistrictData.stats.Total.religion?.muslim?.persons;
            
            logger.info(`Found religion data for ${subdistrictCode}: Hindu=${hinduPopulation}, Muslim=${muslimPopulation}`);
          } else {
            logger.warn(`Subdistrict ${subdistrictCode} not found in religion data`);
          }
        } else {
          logger.warn(`No religion data found for district ${districtLgd}`);
        }
      } else {
        logger.warn(`District with LGD ${districtLgd} not found`);
      }
    }

    const hoverData = {
      subdistrictName: subdistrictCode,
      subdistrictCode: subdistrictCode,
      bdoName, // TODO: Add BDO data source when available
      blockPramukh, // TODO: Add Block Pramukh data source when available
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      population,
      hinduPopulation,
      muslimPopulation,
    };

    logger.info(`Returned hover summary for subdistrict: ${subdistrictCode} (LGD: ${subdistrictLgd})`);
    sendSuccess(res, hoverData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/villages/:villageCode/hover-summary
 * Get lightweight village data for hover tooltip
 */
export const getVillageHoverSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { villageCode } = req.params;

    if (!villageCode) {
      throw new NotFoundError("Village code");
    }

    // Fetch complaints for this village
    const complaints = await Complaint.find({
      village_lgd: villageCode
    }).lean();

    const pendingComplaints = complaints.filter(c => c.status === "pending").length;
    const inProgressComplaints = complaints.filter(c => c.status === "in_progress").length;
    const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;

    // Fetch demographics
    const demographics = await Demographics.findOne({
      level: "village",
      villageLgd: villageCode,
      residence: "total"
    }).lean();

    const population = demographics?.totalPopulation || 0;

    const hoverData = {
      villageName: demographics?.areaName || demographics?.townVillageWard || villageCode,
      villageCode: villageCode,
      sarpanch: undefined, // TODO: Add Sarpanch data source
      gramPradhan: undefined, // TODO: Add Gram Pradhan data source
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      population,
      hinduPopulation: undefined,
      muslimPopulation: undefined,
    };

    logger.info(`Returned hover summary for village: ${villageCode}`);
    sendSuccess(res, hoverData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/towns/:townCode/hover-summary
 * Get lightweight town data for hover tooltip
 */
export const getTownHoverSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { townCode } = req.params;

    if (!townCode) {
      throw new NotFoundError("Town code");
    }

    // Fetch complaints for this town
    const complaints = await Complaint.find({
      village_name: new RegExp(`^${townCode}$`, "i") // Towns might be stored as villages
    }).lean();

    const pendingComplaints = complaints.filter(c => c.status === "pending").length;
    const inProgressComplaints = complaints.filter(c => c.status === "in_progress").length;
    const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;

    // Fetch demographics
    const demographics = await Demographics.findOne({
      level: "town",
      townLgd: townCode,
      residence: "total"
    }).lean();

    const population = demographics?.totalPopulation || 0;

    const hoverData = {
      townName: demographics?.areaName || demographics?.townVillageWard || townCode,
      townCode: townCode,
      municipalChairman: undefined, // TODO: Add Municipal Chairman data source
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      population,
      hinduPopulation: undefined,
      muslimPopulation: undefined,
    };

    logger.info(`Returned hover summary for town: ${townCode}`);
    sendSuccess(res, hoverData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/india/states
 * Get India states GeoJSON data
 */
export const getIndiaStates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // For now, return the Uttar Pradesh data as a placeholder
    // In production, you would have a proper India states GeoJSON file
    const filePath = path.join(__dirname, "../../assets/UttarPradesh.geo.json");

    if (!fs.existsSync(filePath)) {
      throw new Error("India states GeoJSON file not found");
    }

    const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    logger.info("India states GeoJSON data fetched");
    sendSuccess(res, geoData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/state/:stateCode/districts
 * Get districts for a specific state
 */
export const getStateDistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { stateCode } = req.params;

    // For now, if state is Uttar Pradesh, return UP districts
    if (stateCode.toLowerCase() === "uttar pradesh" || stateCode.toLowerCase() === "up") {
      const filePath = path.join(__dirname, "../../assets/UttarPradesh.geo.json");

      if (!fs.existsSync(filePath)) {
        throw new Error("State districts GeoJSON file not found");
      }

      const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      logger.info(`Districts for state ${stateCode} fetched`);
      sendSuccess(res, geoData);
    } else {
      // For other states, try to find the file
      const filePath = path.join(
        __dirname,
        `../../assets/states/${stateCode.toLowerCase()}-districts.geojson`
      );

      if (!fs.existsSync(filePath)) {
        throw new NotFoundError(`Districts data for state: ${stateCode}`);
      }

      const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      logger.info(`Districts for state ${stateCode} fetched`);
      sendSuccess(res, geoData);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/district/:districtCode/subdistricts
 * Get sub-districts for a specific district
 */
export const getDistrictSubdistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { districtCode } = req.params;

    // For Badaun, return the existing Badaun subdistricts data
    if (districtCode.toLowerCase() === "badaun") {
      const filePath = path.join(__dirname, "../../assets/districts/badaun/Badaun.geo.json");

      if (!fs.existsSync(filePath)) {
        throw new NotFoundError(`Sub-districts data for district: ${districtCode}`);
      }

      const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      logger.info(`Sub-districts for district ${districtCode} fetched`);
      sendSuccess(res, geoData);
    } else {
      // For other districts, try to find the file
      const filePath = path.join(
        __dirname,
        `../../assets/districts/${districtCode.toLowerCase()}/subdistricts.geojson`
      );

      if (!fs.existsSync(filePath)) {
        throw new NotFoundError(`Sub-districts data for district: ${districtCode}`);
      }

      const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      logger.info(`Sub-districts for district ${districtCode} fetched`);
      sendSuccess(res, geoData);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/geo/subdistrict/:subdistrictCode/villages
 * Get villages for a specific sub-district
 */
export const getSubdistrictVillages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subdistrictCode } = req.params;

    // Try to find the village data file for this sub-district
    const filePath = path.join(
      __dirname,
      `../../assets/subdistricts/${subdistrictCode.toLowerCase()}/villages.geojson`
    );

    if (!fs.existsSync(filePath)) {
      // Return empty FeatureCollection if file not found
      logger.warn(`Villages data not found for sub-district: ${subdistrictCode}`);
      const emptyGeoJson = {
        type: "FeatureCollection",
        features: []
      };
      sendSuccess(res, emptyGeoJson);
      return;
    }

    const geoData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    logger.info(`Villages for sub-district ${subdistrictCode} fetched`);
    sendSuccess(res, geoData);
  } catch (error) {
    next(error);
  }
};