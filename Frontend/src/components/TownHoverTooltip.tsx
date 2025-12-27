/**
 * Town Hover Tooltip Component
 * Displays a quick summary of town information on hover
 * Shows Municipal Chairman, complaint stats, and demographics
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TownHoverTooltipProps {
  townName: string;
  position: { x: number; y: number };
  data: {
    municipalChairman?: string;
    pendingComplaints?: number;
    inProgressComplaints?: number;
    resolvedComplaints?: number;
    population?: number;
    hinduPopulation?: number;
    muslimPopulation?: number;
  } | null;
  loading?: boolean;
}

export const TownHoverTooltip: React.FC<TownHoverTooltipProps> = ({
  townName,
  position,
  data,
  loading = false,
}) => {
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
      }}
    >
      <Card className="shadow-lg border-2 border-purple-200 bg-white/95 backdrop-blur-sm">
        <div className="p-4 min-w-[280px]">
          <h3 className="font-bold text-lg mb-3 text-[#0c245a] border-b pb-2">
            {townName}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            </div>
          ) : data ? (
            <div className="space-y-2 text-sm">
              {/* Administrative Heads */}
              {data.municipalChairman && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chairman:</span>
                  <span className="font-medium">{data.municipalChairman}</span>
                </div>
              )}

              {/* Divider */}
              {data.municipalChairman && (
                <div className="border-t my-2"></div>
              )}

              {/* Complaints Statistics */}
              {data.pendingComplaints !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-medium text-orange-600">
                    {data.pendingComplaints}
                  </span>
                </div>
              )}
              
              {data.inProgressComplaints !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress:</span>
                  <span className="font-medium text-blue-600">
                    {data.inProgressComplaints}
                  </span>
                </div>
              )}
              
              {data.resolvedComplaints !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved:</span>
                  <span className="font-medium text-green-600">
                    {data.resolvedComplaints}
                  </span>
                </div>
              )}

              {/* Divider */}
              {(data.pendingComplaints !== undefined || data.inProgressComplaints !== undefined || data.resolvedComplaints !== undefined) && (
                <div className="border-t my-2"></div>
              )}

              {/* Demographics */}
              {data.population !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Population:</span>
                  <span className="font-medium">
                    {data.population.toLocaleString()}
                  </span>
                </div>
              )}
              
              {data.hinduPopulation !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hindu:</span>
                  <span className="font-medium">
                    {data.hinduPopulation.toLocaleString()}
                  </span>
                </div>
              )}
              
              {data.muslimPopulation !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Muslim:</span>
                  <span className="font-medium">
                    {data.muslimPopulation.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}

          <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
            Click for detailed view
          </div>
        </div>
      </Card>
    </div>
  );
};

