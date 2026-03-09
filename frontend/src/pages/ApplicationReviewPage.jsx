import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { api, authHeaders, decisionBadgeClass, statusBadgeClass, toCurrency } from "@/lib/api";

export default function ApplicationReviewPage() {
  const { applicationId } = useParams();
  const [applicationData, setApplicationData] = useState(null);
  const [status, setStatus] = useState("in_review");
  const [overrideDecision, setOverrideDecision] = useState("approved");
  const [overrideReason, setOverrideReason] = useState("");
  const [note, setNote] = useState("");

  const fetchApplicationData = async () => {
    try {
      const response = await api.get(`/admin/applications/${applicationId}`, {
        headers: authHeaders(),
      });
      setApplicationData(response.data);
      setStatus(response.data.application.status);
    } catch {
      toast.error("Unable to load application details.");
    }
  };

  useEffect(() => {
    fetchApplicationData();
  }, [applicationId]);

  const updateStatus = async () => {
    try {
      await api.put(
        `/admin/applications/${applicationId}/status`,
        { status },
        { headers: authHeaders() },
      );
      toast.success("Status updated.");
      fetchApplicationData();
    } catch {
      toast.error("Status update failed.");
    }
  };

  const reevaluate = async () => {
    try {
      await api.post(`/admin/applications/${applicationId}/reevaluate`, null, {
        headers: authHeaders(),
      });
      toast.success("Application re-evaluated with latest rules.");
      fetchApplicationData();
    } catch {
      toast.error("Re-evaluation failed.");
    }
  };

  const submitOverride = async () => {
    if (overrideReason.trim().length < 5) {
      toast.error("Please add a valid override reason.");
      return;
    }

    try {
      await api.post(
        `/admin/applications/${applicationId}/override`,
        { decision: overrideDecision, reason: overrideReason },
        { headers: authHeaders() },
      );
      toast.success("Manual override saved.");
      setOverrideReason("");
      fetchApplicationData();
    } catch {
      toast.error("Manual override failed.");
    }
  };

  const addNote = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note.");
      return;
    }

    try {
      await api.post(
        `/admin/applications/${applicationId}/notes`,
        { note },
        { headers: authHeaders() },
      );
      toast.success("Review note added.");
      setNote("");
      fetchApplicationData();
    } catch {
      toast.error("Unable to add note.");
    }
  };

  if (!applicationData) {
    return (
      <Card data-testid="admin-review-loading-card">
        <CardContent className="p-6">Loading application details...</CardContent>
      </Card>
    );
  }

  const { application, audit } = applicationData;
  const scoreChartData = [{ name: "score", value: application.weighted_score, fill: "hsl(var(--primary))" }];

  return (
    <div className="space-y-8" data-testid="admin-application-review-page">
      <header className="flex flex-wrap gap-4 justify-between items-start" data-testid="admin-review-header">
        <div>
          <h1 className="text-4xl" data-testid="admin-review-heading">
            {application.full_name}
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="admin-review-application-id">
            Application ID: {application.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`${decisionBadgeClass[application.final_decision]} capitalize`} data-testid="admin-review-decision-badge">
            Final: {application.final_decision}
          </Badge>
          <Badge className={`${statusBadgeClass[application.status]} capitalize`} data-testid="admin-review-status-badge">
            {application.status.replace("_", " ")}
          </Badge>
        </div>
      </header>

      <section className="grid xl:grid-cols-[1.2fr_1fr] gap-6" data-testid="admin-review-main-grid">
        <Card>
          <CardHeader>
            <CardTitle data-testid="admin-review-profile-heading">Applicant profile</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <p data-testid="admin-review-loan-type">Loan Type: <strong className="capitalize">{application.loan_type}</strong></p>
            <p data-testid="admin-review-email">Email: <strong>{application.email}</strong></p>
            <p data-testid="admin-review-phone">Phone: <strong>{application.phone}</strong></p>
            <p data-testid="admin-review-income">Annual Income: <strong>{toCurrency(application.annual_income)}</strong></p>
            <p data-testid="admin-review-loan-amount">Loan Amount: <strong>{toCurrency(application.loan_amount)}</strong></p>
            <p data-testid="admin-review-credit-score">Credit Score: <strong>{application.credit_score}</strong></p>
            <p data-testid="admin-review-monthly-debt">Monthly Debt: <strong>{toCurrency(application.monthly_debt)}</strong></p>
            <p data-testid="admin-review-employment-years">Employment Years: <strong>{application.employment_years}</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="admin-review-score-heading">Weighted score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-56" data-testid="admin-review-score-chart">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={scoreChartData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" cornerRadius={12} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-3xl font-semibold" data-testid="admin-review-weighted-score-value">
              {application.weighted_score}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p data-testid="admin-breakdown-credit">Credit: {application.score_breakdown.credit}</p>
              <p data-testid="admin-breakdown-income">Income: {application.score_breakdown.income}</p>
              <p data-testid="admin-breakdown-dti">DTI Score: {application.score_breakdown.debt_to_income}</p>
              <p data-testid="admin-breakdown-employment">Employment: {application.score_breakdown.employment}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid lg:grid-cols-3 gap-6" data-testid="admin-review-actions-grid">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" data-testid="admin-update-status-heading">Update status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="admin-update-status-select">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={updateStatus} className="w-full" data-testid="admin-update-status-button">
              Save status
            </Button>
            <Button onClick={reevaluate} variant="outline" className="w-full" data-testid="admin-reevaluate-button">
              Re-evaluate using latest rules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg" data-testid="admin-override-heading">Manual override</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={overrideDecision} onValueChange={setOverrideDecision}>
              <SelectTrigger data-testid="admin-override-decision-select">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Override rationale"
              data-testid="admin-override-reason-input"
            />
            <Button className="w-full" onClick={submitOverride} data-testid="admin-override-submit-button">
              Apply manual override
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg" data-testid="admin-note-heading">Review notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="review_note">Add note</Label>
            <Input
              id="review_note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="admin-note-input"
            />
            <Button className="w-full" onClick={addNote} data-testid="admin-note-submit-button">
              Save note
            </Button>
            <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap" data-testid="admin-existing-notes-box">
              {application.admin_notes || "No notes yet."}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle data-testid="admin-audit-heading">Audit history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {audit.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-3 text-sm" data-testid={`admin-audit-entry-${entry.id}`}>
              <p className="font-semibold capitalize">{entry.action.replace("_", " ")}</p>
              <p className="text-muted-foreground">{entry.details}</p>
              <p className="text-xs text-muted-foreground mt-1">{entry.created_at}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
