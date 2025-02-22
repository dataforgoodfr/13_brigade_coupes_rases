import { Card, CardContent } from "@/components/ui/card";

const data = [
    { name: "Nombre de coupes-rases en 2024", nb: 300},
    { name: "Donnée2", nb: 100},
    { name: "Donnée3", nb: 150 },
  ];

export function Dashboard() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {data.map((data, index) => (
          <Card key={index} className="bg-white shadow-lg rounded-2xl p-4">
            <CardContent className="flex items-center">
              <div>
                <p className="text-gray-600">{data.name}</p>
                <p className="text-2xl font-bold">{data.nb}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    );
}