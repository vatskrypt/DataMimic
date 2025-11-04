// Referenced from javascript_database integration blueprint
import {
  datasets,
  generations,
  evaluations,
  type Dataset,
  type InsertDataset,
  type Generation,
  type InsertGeneration,
  type Evaluation,
  type InsertEvaluation,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Dataset operations
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  getDataset(id: string): Promise<Dataset | undefined>;
  getAllDatasets(): Promise<Dataset[]>;
  deleteDataset(id: string): Promise<void>;

  // Generation operations
  createGeneration(generation: InsertGeneration): Promise<Generation>;
  getGeneration(id: string): Promise<Generation | undefined>;
  getGenerationsByDataset(datasetId: string): Promise<Generation[]>;
  updateGeneration(id: string, data: Partial<Generation>): Promise<Generation | undefined>;
  getLatestGeneration(): Promise<Generation | undefined>;

  // Evaluation operations
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluationByGeneration(generationId: string): Promise<Evaluation | undefined>;
}

export class DatabaseStorage implements IStorage {
  private dbPromise: Promise<any>;

  constructor() {
    // Lazy import the DB module so we don't error when DATABASE_URL is missing
    this.dbPromise = import("./db").then(mod => mod.db);
  }

  // Dataset operations
  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const db = await this.dbPromise;
    const [dataset] = await db
      .insert(datasets)
      .values(insertDataset)
      .returning();
    return dataset;
  }

  async getDataset(id: string): Promise<Dataset | undefined> {
    const db = await this.dbPromise;
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset || undefined;
  }

  async getAllDatasets(): Promise<Dataset[]> {
    const db = await this.dbPromise;
    return await db.select().from(datasets).orderBy(desc(datasets.uploadedAt));
  }

  async deleteDataset(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(datasets).where(eq(datasets.id, id));
  }

  // Generation operations
  async createGeneration(insertGeneration: InsertGeneration): Promise<Generation> {
    const db = await this.dbPromise;
    const [generation] = await db
      .insert(generations)
      .values(insertGeneration)
      .returning();
    return generation;
  }

  async getGeneration(id: string): Promise<Generation | undefined> {
    const db = await this.dbPromise;
    const [generation] = await db.select().from(generations).where(eq(generations.id, id));
    return generation || undefined;
  }

  async getGenerationsByDataset(datasetId: string): Promise<Generation[]> {
    const db = await this.dbPromise;
    return await db
      .select()
      .from(generations)
      .where(eq(generations.datasetId, datasetId))
      .orderBy(desc(generations.generatedAt));
  }

  async updateGeneration(id: string, data: Partial<Generation>): Promise<Generation | undefined> {
    const db = await this.dbPromise;
    const [updated] = await db
      .update(generations)
      .set(data)
      .where(eq(generations.id, id))
      .returning();
    return updated || undefined;
  }

  async getLatestGeneration(): Promise<Generation | undefined> {
    const db = await this.dbPromise;
    const [generation] = await db
      .select()
      .from(generations)
      .orderBy(desc(generations.generatedAt))
      .limit(1);
    return generation || undefined;
  }

  // Evaluation operations
  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const db = await this.dbPromise;
    const [evaluation] = await db
      .insert(evaluations)
      .values(insertEvaluation)
      .returning();
    return evaluation;
  }

  async getEvaluationByGeneration(generationId: string): Promise<Evaluation | undefined> {
    const db = await this.dbPromise;
    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.generationId, generationId));
    return evaluation || undefined;
  }
}

// In-memory fallback storage for local/dev without DATABASE_URL
class InMemoryStorage implements IStorage {
  private datasets: Dataset[] = [];
  private generations: Generation[] = [];
  private evaluations: Evaluation[] = [];

  private id() {
    return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  }

  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const item: Dataset = {
      id: this.id(),
      uploadedAt: new Date(),
      ...insertDataset,
    } as Dataset;
    this.datasets.push(item);
    return item;
  }

  async getDataset(id: string): Promise<Dataset | undefined> {
    return this.datasets.find(d => d.id === id);
  }

  async getAllDatasets(): Promise<Dataset[]> {
    return [...this.datasets].sort((a, b) => (b.uploadedAt?.getTime?.() || 0) - (a.uploadedAt?.getTime?.() || 0));
  }

  async deleteDataset(id: string): Promise<void> {
    this.datasets = this.datasets.filter(d => d.id !== id);
    this.generations = this.generations.filter(g => g.datasetId !== id);
    this.evaluations = this.evaluations.filter(e => !this.generations.find(g => g.id === e.generationId));
  }

  async createGeneration(insertGeneration: InsertGeneration): Promise<Generation> {
    const item: Generation = {
      id: this.id(),
      generatedAt: new Date(),
      ...insertGeneration,
    } as Generation;
    this.generations.push(item);
    return item;
  }

  async getGeneration(id: string): Promise<Generation | undefined> {
    return this.generations.find(g => g.id === id);
  }

  async getGenerationsByDataset(datasetId: string): Promise<Generation[]> {
    return this.generations.filter(g => g.datasetId === datasetId).sort((a, b) => (b.generatedAt?.getTime?.() || 0) - (a.generatedAt?.getTime?.() || 0));
  }

  async updateGeneration(id: string, data: Partial<Generation>): Promise<Generation | undefined> {
    const idx = this.generations.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    this.generations[idx] = { ...this.generations[idx], ...data } as Generation;
    return this.generations[idx];
  }

  async getLatestGeneration(): Promise<Generation | undefined> {
    return [...this.generations].sort((a, b) => (b.generatedAt?.getTime?.() || 0) - (a.generatedAt?.getTime?.() || 0))[0];
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const item: Evaluation = {
      id: this.id(),
      evaluatedAt: new Date(),
      ...insertEvaluation,
    } as Evaluation;
    this.evaluations.push(item);
    return item;
  }

  async getEvaluationByGeneration(generationId: string): Promise<Evaluation | undefined> {
    return this.evaluations.find(e => e.generationId === generationId);
  }
}

export const storage: IStorage = process.env.DATABASE_URL ? new DatabaseStorage() : new InMemoryStorage();
