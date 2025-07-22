import { IconCheck, IconX } from "@tabler/icons-react";

interface VehicleCoverageHeatMapProps {
  vehicleCoverageData: Array<{
    unitId: string;
    unitName: string | null;
    unitType: string | null;
    coverage: Array<{
      date: string;
      covered: boolean;
    }>;
  }>;
}

export function VehicleCoverageHeatMap({ vehicleCoverageData }: VehicleCoverageHeatMapProps) {
  if (vehicleCoverageData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No vehicle data available
      </div>
    );
  }

  // Get last 7 days headers
  const dates = vehicleCoverageData[0]?.coverage.map(c => {
    const date = new Date(c.date);
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  }) || [];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_repeat(7,_16px)] gap-1 text-xs text-muted-foreground">
        <div>Vehicle</div>
        {dates.map((day, index) => (
          <div key={index} className="text-center">{day}</div>
        ))}
      </div>
      
      {/* Heat map rows */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {vehicleCoverageData.slice(0, 8).map((vehicle) => (
          <div key={vehicle.unitId} className="grid grid-cols-[1fr_repeat(7,_16px)] gap-1 items-center">
            <div className="text-xs truncate" title={vehicle.unitName || 'Unknown'}>
              {vehicle.unitName || 'Unknown'}
            </div>
            {vehicle.coverage.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                  day.covered 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}
                title={`${vehicle.unitName} - ${day.date}: ${day.covered ? 'Covered' : 'Not covered'}`}
              >
                {day.covered ? (
                  <IconCheck className="size-2" />
                ) : (
                  <IconX className="size-2" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {vehicleCoverageData.length > 8 && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          Showing first 8 of {vehicleCoverageData.length} vehicles
        </div>
      )}
    </div>
  );
}
