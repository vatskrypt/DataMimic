import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download as DownloadIcon, FileText, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Download() {
  const { toast } = useToast();
  const [generationId, setGenerationId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentGenerationId');
    setGenerationId(id);
  }, []);

  const { data } = useQuery({
    queryKey: ['/api/generations', generationId],
    enabled: !!generationId,
  });

  const evaluation = data?.evaluation;
  const generation = data?.generation;

  const handleDownloadCSV = () => {
    if (generationId) {
      window.location.href = `/api/download/${generationId}`;
      toast({
        title: "Download started",
        description: "Your synthetic dataset is being downloaded",
      });
    }
  };

  const handleDownloadReport = () => {
    if (generationId) {
      window.location.href = `/api/report/${generationId}`;
      toast({
        title: "Report generation",
        description: "Your PDF report is being generated",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Download Results</h1>
        <p className="text-muted-foreground">Export your synthetic dataset and evaluation report</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synthetic Dataset Card */}
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ready
              </Badge>
            </div>
            <CardTitle>Synthetic Dataset</CardTitle>
            <CardDescription>
              Download your generated synthetic data in CSV format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">CSV</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rows:</span>
                <span className="font-medium">{generation?.syntheticData?.split('\n').length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Columns:</span>
                <span className="font-medium">{generation?.syntheticData?.split('\n')[0]?.split(',').length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-medium">~{Math.round((generation?.syntheticData?.length || 0) / 1024)} KB</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Included Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>All original column names and types preserved</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Statistical properties maintained</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Privacy-preserving transformations applied</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Ready for ML model training</span>
                </li>
              </ul>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleDownloadCSV}
              data-testid="button-download-csv"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        {/* Evaluation Report Card */}
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ready
              </Badge>
            </div>
            <CardTitle>Evaluation Report</CardTitle>
            <CardDescription>
              Comprehensive analysis report with metrics and visualizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">PDF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pages:</span>
                <span className="font-medium">~8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-medium">~1.2 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Charts:</span>
                <span className="font-medium">6 visualizations</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Report Contents</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Executive summary with key findings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Privacy and utility score breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Distribution and correlation charts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Statistical validation metrics</span>
                </li>
              </ul>
            </div>

            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={handleDownloadReport}
              data-testid="button-download-report"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>Important information about your synthetic dataset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Use synthetic data for development and testing environments</li>
                <li>• Validate ML model performance with real data before deployment</li>
                <li>• Share synthetic datasets with partners without privacy concerns</li>
                <li>• Maintain documentation of generation parameters used</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Limitations</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Synthetic data may not capture all edge cases</li>
                <li>• Rare patterns might be underrepresented</li>
                <li>• Always verify compliance with your data policies</li>
                <li>• Test ML models on real data before production use</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Generation Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Model Used</p>
                <p className="font-medium">{generation?.modelType.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Privacy Score</p>
                <p className="font-medium text-green-600 dark:text-green-400">{evaluation?.privacyScore?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Utility Score</p>
                <p className="font-medium text-blue-600 dark:text-blue-400">{evaluation?.utilityScore?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{generation?.status}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.href = '/upload'} data-testid="button-new-dataset">
          Upload New Dataset
        </Button>
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={handleDownloadCSV}
            data-testid="button-download-all"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download All Files
          </Button>
        </div>
      </div>
    </div>
  );
}
