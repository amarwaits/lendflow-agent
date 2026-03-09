import { Layers2, Server, Settings, ShieldCheck, TableProperties } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const architectureCards = [
  {
    title: "Frontend Layer",
    icon: Layers2,
    points: [
      "React + Tailwind + Shadcn UI",
      "Public onboarding + protected admin workflow",
      "Decision and scoring visualizations",
    ],
  },
  {
    title: "Backend Layer",
    icon: Server,
    points: [
      "FastAPI REST endpoints for onboarding and admin actions",
      "Weighted underwriting engine with thresholds",
      "JWT-based admin authentication",
    ],
  },
  {
    title: "Data Layer",
    icon: TableProperties,
    points: [
      "SQLite database for lightweight setup",
      "Tables: applications, underwriting_rules, application_audit",
      "Audit trail for status changes and overrides",
    ],
  },
  {
    title: "Operations Layer",
    icon: Settings,
    points: [
      "Dockerfile for backend containerization",
      "docker-compose for running frontend + backend together",
      "Simple path to production with managed containers",
    ],
  },
];

export default function ArchitecturePage({ adminView = false }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-0 py-2 md:py-4 space-y-10" data-testid="architecture-page">
      <header className="space-y-4" data-testid="architecture-header">
        <p className="text-xs uppercase tracking-[0.24em] text-primary/80" data-testid="architecture-label">
          Solution blueprint
        </p>
        <h1 className="text-4xl sm:text-5xl" data-testid="architecture-heading">
          Mortgage onboarding architecture and technology recommendation
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-4xl" data-testid="architecture-description">
          The platform separates customer onboarding from admin underwriting operations, keeps scoring logic inside
          the backend, and records an auditable manual override trail.
        </p>
        {!adminView && (
          <Button onClick={() => navigate("/")} data-testid="architecture-back-to-onboarding-button">
            Back to onboarding
          </Button>
        )}
      </header>

      <section className="grid md:grid-cols-2 gap-6" data-testid="architecture-cards-grid">
        {architectureCards.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="h-full" data-testid={`architecture-card-${section.title}`}>
              <CardHeader className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-accent text-primary grid place-content-center">
                  <Icon size={18} />
                </div>
                <CardTitle data-testid={`architecture-card-title-${section.title}`}>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.points.map((point) => (
                    <li key={point} data-testid={`architecture-point-${section.title}-${point}`}>
                      • {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card data-testid="architecture-underwriting-model-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="architecture-underwriting-model-heading">
            <ShieldCheck size={18} /> Underwriting Model (Intermediate Weighted + Manual Override)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p data-testid="architecture-underwriting-model-point-1">
            1. For each loan type (home, car, personal), configurable factor weights are maintained in backend rules.
          </p>
          <p data-testid="architecture-underwriting-model-point-2">
            2. System computes component scores for credit quality, income strength, debt burden, and employment stability.
          </p>
          <p data-testid="architecture-underwriting-model-point-3">
            3. Weighted total score is compared against review and approval thresholds to determine auto-decision.
          </p>
          <p data-testid="architecture-underwriting-model-point-4">
            4. Admin can re-evaluate with latest rules and manually override final decision with mandatory reason capture.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
