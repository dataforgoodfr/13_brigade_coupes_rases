import { Card, CardContent } from "@/components/ui/card";
import { useGetClearCuttingsQuery } from "@/features/clear-cutting/store/api";
import { Download } from "lucide-react";

const downloadCSV = (displayedData: Record<string, any>) => {
  const csvRows = [];
  csvRows.push(Object.keys(displayedData).map(key => key).join(","));
  csvRows.push(Object.entries(displayedData).map(([key, data]) => data.value).join(","));
  const csvString = csvRows.join("\n");

  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "dataDashboard.csv";
  link.click();
  URL.revokeObjectURL(url);
};

function getDisplayedData(dataPreview: Array<any>|undefined){
  return {
    totalNumber : {
      title : "Nombre total de coupes-rases",
      value : dataPreview?.length
    },
    total2021 :{
      title : "Nombre de coupes-rases en 2021",
      value : dataPreview?.filter(element => element.cutYear === 2021).length
    },
    total2022 :{
      title : "Nombre de coupes-rases en 2022",
      value : dataPreview?.filter(element => element.cutYear === 2022).length
    },
    total2023 :{
      title : "Nombre de coupes-rases en 2023",
      value : dataPreview?.filter(element => element.cutYear === 2023).length
    },
    rejected :{
      title : "Coupes-rases rejetés",
      value : dataPreview?.filter(element => element.status === "rejected").length
    },
    toValidate :{
      title : "Coupes-rases à valider",
      value : dataPreview?.filter(element => element.status === "toValidate").length
    },
    enAttenteInformation :{
      title : "En attente d'informations",
      value : dataPreview?.filter(element => element.status === "waitingInformation").length
    },
    validated :{
      title : "Coupes-rases validées",
      value : dataPreview?.filter(element => element.status === "validated").length
    }
  }
}

export function Dashboard() {
  const { data } = useGetClearCuttingsQuery();
  const displayedData = getDisplayedData(data?.clearCuttingPreviews);
  return (
    <div className="p-4 sm:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card key='totalClearCutting' className="bg-gray-100 shadow-lg rounded-2xl p-4">
            <CardContent className="flex items-center">
              <div>
                <p className="text-gray-600">{displayedData.totalNumber.title}</p>
                <p className="text-2xl font-bold">{displayedData.totalNumber.value}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <button onClick={() => downloadCSV(displayedData)} className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-400">
          <Download className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mb-6">
        {[
          displayedData.rejected,
          displayedData.toValidate,
          displayedData.enAttenteInformation,
          displayedData.validated,
        ].map((statusData) => (
          <Card key={statusData.title} className="bg-purple-100 shadow-lg rounded-2xl p-4 w-55">
            <CardContent className="flex items-center justify-center p-2">
              <div className="text-center">
                <p className="text-gray-600 text-sm">{statusData.title}</p>
                <p className="text-xl font-bold">{statusData.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          displayedData.total2021,
          displayedData.total2022,
          displayedData.total2023,
        ].map((yearData) => (
          <Card key={yearData.title} className="bg-blue-100 shadow-lg rounded-2xl p-4">
            <CardContent className="flex items-center">
              <div>
                <p className="text-gray-600">{yearData.title}</p>
                <p className="text-2xl font-bold">{yearData.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}