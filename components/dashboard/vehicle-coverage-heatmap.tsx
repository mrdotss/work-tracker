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
        Tidak ada data unit
      </div>
    );
  }

  // Get last 7 days headers
  const dates = vehicleCoverageData[0]?.coverage.map(c => {
    const date = new Date(c.date);
    return {
      short: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      full: date.toLocaleDateString('id-ID', { 
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      })
    };
  }) || [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[200px_repeat(7,_minmax(30px,_1fr))] gap-1 text-sm font-medium text-muted-foreground">
        <div>Unit</div>
        {dates.map((day, index) => (
          <div key={index} className="text-center" title={day.full}>
            {day.short}
          </div>
        ))}
      </div>
      
      {/* Heat map rows */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {vehicleCoverageData.slice(0, 10).map((vehicle) => (
          <div key={vehicle.unitId} className="grid grid-cols-[200px_repeat(7,_minmax(30px,_1fr))] gap-3 items-center">
            <div className="text-sm truncate font-medium" title={vehicle.unitName || 'Unknown'}>
              {vehicle.unitName || 'Unknown'}
            </div>
            {vehicle.coverage.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  day.covered 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={`${vehicle.unitName} - ${day.date}: ${day.covered ? 'Tercover' : 'Tidak tercover'}`}
              >
                {day.covered ? (
                  <IconCheck className="size-3" />
                ) : (
                  <IconX className="size-3" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {vehicleCoverageData.length > 10 && (
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          Menampilkan 10 dari {vehicleCoverageData.length} unit
        </div>
      )}
    </div>
  );
}