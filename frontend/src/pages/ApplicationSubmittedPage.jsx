import { useEffect, useState } from "react";
import { ArrowLeft, CircleCheckBig } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, decisionBadgeClass, statusBadgeClass, toCurrency } from "@/lib/api";

export default function ApplicationSubmittedPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await api.get(`/applications/${applicationId}`);
        setApplication(response.data);
      } catch {
        setError("We could not locate your application details.");
      }
    };

    fetchApplication();
  }, [applicationId]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-12" data-testid="submission-error-wrapper">
        <Card>
          <CardHeader>
            <CardTitle data-testid="submission-error-title">Application not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p data-testid="submission-error-message">{error}</p>
            <Button onClick={() => navigate("/")} data-testid="submission-error-home-button">
              Back to onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-12" data-testid="submission-loading-wrapper">
        <Card>
          <CardContent className="p-8">Loading application status...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-8" data-testid="submission-page">
      <Card className="shadow-sm border-border">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-green-700" data-testid="submission-success-icon-row">
            <CircleCheckBig size={20} />
            <span className="text-sm font-medium">Application received</span>
          </div>
          <CardTitle className="text-3xl" data-testid="submission-main-title">
            Thank you, {application.full_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground" data-testid="submission-app-id">
            Tracking ID: {application.id}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 bg-white" data-testid="submission-loan-summary">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Loan Type</p>
              <p className="text-lg font-semibold capitalize" data-testid="submission-loan-type">
                {application.loan_type}
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-white" data-testid="submission-amount-summary">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Requested Amount</p>
              <p className="text-lg font-semibold" data-testid="submission-loan-amount">
                {toCurrency(application.loan_amount)}
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-white" data-testid="submission-score-summary">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Eligibility Score</p>
              <p className="text-lg font-semibold" data-testid="submission-weighted-score">
                {application.weighted_score}
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-white flex flex-col gap-2" data-testid="submission-decision-summary">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Decision</p>
              <Badge
                className={`w-fit capitalize ${decisionBadgeClass[application.final_decision]}`}
                data-testid="submission-final-decision-badge"
              >
                {application.final_decision}
              </Badge>
              <Badge
                className={`w-fit capitalize ${statusBadgeClass[application.status]}`}
                data-testid="submission-current-status-badge"
              >
                {application.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/")} data-testid="submission-new-application-button">
              <ArrowLeft size={16} /> New application
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/login")} data-testid="submission-admin-login-button">
              Go to admin review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
