import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Brain, Activity, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type ModelType = 'ctgan' | 'copula';

export default function Models() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<ModelType | null>(null);
  const [epochs, setEpochs] = useState([300]);
  const [batchSize, setBatchSize] = useState([500]);
  const [analyze, setAnalyze] = useState<{ columns: string[]; dtypes: {name: string; dtype: string; suggestions: any}[]; relations: string[][] } | null>(null);
  const [colsToSynth, setColsToSynth] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<Record<string, { type?: string; min?: number; max?: number }>>({});
  const [relations, setRelations] = useState<string[][]>([]);

  useEffect(() => {
    const datasetId = localStorage.getItem('currentDatasetId');
    if (!datasetId) return;
    (async () => {
      try {
        const res = await apiRequest('POST', '/api/analyze_dataset', { datasetId });
        const data = await res.json();
        setAnalyze(data);
        // seed constraints from suggestions
        const seeded: Record<string, {type?: string; min?: number; max?: number}> = {};
        for (const d of data.dtypes || []) {
          seeded[d.name] = { type: d.suggestions?.type, min: d.suggestions?.min, max: d.suggestions?.max };
        }
        setConstraints(seeded);
        setRelations(data.relations || []);
      } catch (e: any) {
        console.error('analyze failed', e);
      }
    })();
  }, []);

  const models = [
    {
      id: 'ctgan' as ModelType,
      name: 'CTGAN',
      icon: Brain,
      description: 'Conditional Tabular GAN for complex data patterns',
      longDescription: 'Deep learning-based generative model that uses conditional generative adversarial networks to create synthetic tabular data.',
      pros: [
        'Excellent for complex, non-linear relationships',
        'Handles mixed data types well',
        'State-of-the-art results',
      ],
      cons: [
        'Requires more computation time',
        'May need parameter tuning',
        'Best for larger datasets (>1000 rows)',
      ],
      useCase: 'Recommended for complex datasets with intricate patterns',
    },
    {
      id: 'copula' as ModelType,
      name: 'Gaussian Copula',
      icon: Activity,
      description: 'Probabilistic model preserving correlations',
      longDescription: 'Statistical model that captures dependencies between variables using copula functions to generate synthetic data.',
      pros: [
        'Fast generation speed',
        'Preserves correlations accurately',
        'Works well with small datasets',
      ],
      cons: [
        'May not capture complex patterns',
        'Assumes certain distributions',
        'Limited flexibility for non-linear data',
      ],
      useCase: 'Ideal for simple to moderate complexity datasets',
    },
  ];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const datasetId = localStorage.getItem('currentDatasetId');
      if (!datasetId) {
        throw new Error('No dataset selected');
      }

      // Always use controlled endpoint. If user didn't select columns, default to all columns
      const selected = colsToSynth.length > 0 ? colsToSynth : (analyze?.columns ?? []);
      const res = await apiRequest('POST', '/api/generate_controlled', {
        datasetId,
        cols_to_synthesize: selected,
        constraints,
        relations,
        modelType: selectedModel ?? 'auto',
        parameters: {
          epochs: epochs[0],
          batchSize: batchSize[0],
        },
      });
      return await res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('currentGenerationId', data.generation.id);
      toast({
        title: "Generation complete",
        description: "Synthetic data generated successfully",
      });
      setLocation('/results');
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = useCallback(() => {
    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model before proceeding",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  }, [selectedModel, generateMutation, toast]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Model Selection</h1>
        <p className="text-muted-foreground">Choose a generation model and configure parameters</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Upload</span>
        </div>
        <div className="w-12 h-0.5 bg-primary" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium">Model</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-border text-muted-foreground flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-sm text-muted-foreground">Results</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-border text-muted-foreground flex items-center justify-center text-sm font-medium">
            4
          </div>
          <span className="text-sm text-muted-foreground">Download</span>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedModel === model.id;

          return (
            <Card
              key={model.id}
              className={`hover-elevate cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedModel(model.id)}
              data-testid={`card-model-${model.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Selected
                    </Badge>
                  )}
                </div>
                <CardTitle>{model.name}</CardTitle>
                <CardDescription>{model.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{model.longDescription}</p>

                <div>
                  <p className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">Pros:</p>
                  <ul className="text-sm space-y-1">
                    {model.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">•</span>
                        <span className="text-muted-foreground">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 text-orange-600 dark:text-orange-400">Cons:</p>
                  <ul className="text-sm space-y-1">
                    {model.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400">•</span>
                        <span className="text-muted-foreground">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-primary">{model.useCase}</p>
                </div>

                <Button
                  className="w-full"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModel(model.id);
                  }}
                  data-testid={`button-select-${model.id}`}
                >
                  {isSelected ? 'Selected' : 'Select Model'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Parameters Section */}
      {selectedModel && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Parameters</CardTitle>
            <CardDescription>Fine-tune the generation process (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="parameters">
                <AccordionTrigger data-testid="accordion-parameters">
                  Configure Generation Parameters
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {selectedModel === 'ctgan' && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="epochs">Training Epochs</Label>
                          <span className="text-sm text-muted-foreground font-mono">{epochs[0]}</span>
                        </div>
                        <Slider
                          id="epochs"
                          min={50}
                          max={500}
                          step={50}
                          value={epochs}
                          onValueChange={setEpochs}
                          data-testid="slider-epochs"
                        />
                        <p className="text-xs text-muted-foreground">
                          More epochs improve quality but increase generation time
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="batch-size">Batch Size</Label>
                          <span className="text-sm text-muted-foreground font-mono">{batchSize[0]}</span>
                        </div>
                        <Slider
                          id="batch-size"
                          min={100}
                          max={1000}
                          step={100}
                          value={batchSize}
                          onValueChange={setBatchSize}
                          data-testid="slider-batch-size"
                        />
                        <p className="text-xs text-muted-foreground">
                          Larger batch sizes speed up training but require more memory
                        </p>
                      </div>
                    </>
                  )}

                  {selectedModel === 'copula' && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Gaussian Copula uses default parameters optimized for statistical accuracy. 
                        Generation is typically fast and doesn't require parameter tuning.
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="controlled">
                <AccordionTrigger>Controlled Generation (column selection and constraints)</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {analyze ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Select columns to synthesize</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {analyze.columns.map((col) => (
                            <label key={col} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={colsToSynth.includes(col)}
                                onChange={(e) => {
                                  setColsToSynth((prev) => e.target.checked ? [...prev, col] : prev.filter(c => c !== col));
                                }}
                              />
                              <span>{col}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {colsToSynth.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Constraints</p>
                          <div className="space-y-2">
                            {colsToSynth.map((col) => {
                              const cfg = constraints[col] || {};
                              return (
                                <div key={col} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                  <div className="md:col-span-1 text-sm font-medium">{col}</div>
                                  <input
                                    className="border rounded px-2 py-1 text-sm"
                                    placeholder="type (int|float|categorical)"
                                    value={cfg.type || ''}
                                    onChange={(e) => setConstraints((prev) => ({ ...prev, [col]: { ...prev[col], type: e.target.value } }))}
                                  />
                                  <input
                                    type="number"
                                    className="border rounded px-2 py-1 text-sm"
                                    placeholder="min"
                                    value={cfg.min ?? ''}
                                    onChange={(e) => setConstraints((prev) => ({ ...prev, [col]: { ...prev[col], min: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                                  />
                                  <input
                                    type="number"
                                    className="border rounded px-2 py-1 text-sm"
                                    placeholder="max"
                                    value={cfg.max ?? ''}
                                    onChange={(e) => setConstraints((prev) => ({ ...prev, [col]: { ...prev[col], max: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {analyze.relations && analyze.relations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Suggested relations (locked)</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {relations.map((pair, idx) => (
                              <span key={idx} className="px-2 py-1 rounded bg-muted">{pair[0]} ↔ {pair[1]}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Analyzing dataset...</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => setLocation('/upload')} data-testid="button-back">
          Back to Upload
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!selectedModel || generateMutation.isPending}
          data-testid="button-generate"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Synthetic Data
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
