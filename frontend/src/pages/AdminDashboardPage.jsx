import { useEffect, useState } from "react";
import { Eye, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { api, authHeaders, decisionBadgeClass, statusBadgeClass } from "@/lib/api";

const metricCards = [
  { key: "total_applications", label: "Total applications" },
  { key: "pending_review", label: "Pending review" },
  { key: "approved_count", label: "Approved" },
  { key: "rejected_count", label: "Rejected" },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, applicationsRes] = await Promise.all([
        api.get("/admin/dashboard", { headers: authHeaders() }),
        api.get("/admin/applications", { headers: authHeaders() }),
      ]);
      setDashboard(dashboardRes.data);
      setApplications(applicationsRes.data);
    } catch {
      toast.error("Unable to load dashboard data.");
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filteredApplications =
    statusFilter === "all"
      ? applications
      : applications.filter((item) => item.status === statusFilter);

  return (
    <div className="space-y-10" data-testid="admin-dashboard-page">
      <header className="space-y-3 soft-rise" data-testid="admin-dashboard-header">
        <h1 className="text-4xl sm:text-5xl" data-testid="admin-dashboard-heading">
          Underwriting Review Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground" data-testid="admin-dashboard-description">
          Monitor applications, review automated decisions, and process manual underwriting steps.
        </p>
      </header>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 soft-rise stagger-1" data-testid="admin-metrics-grid">
        {metricCards.map((metric) => (
          <Card key={metric.key} data-testid={`admin-metric-card-${metric.key}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold" data-testid={`admin-metric-value-${metric.key}`}>
                {dashboard?.[metric.key] ?? "-"}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="soft-rise stagger-2" data-testid="admin-applications-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle data-testid="admin-applications-heading">Applications queue</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="admin-average-score-text">
              Portfolio average score: {dashboard?.average_score ?? "-"}
            </p>
          </div>

          <div className="w-full sm:w-52">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="admin-status-filter-select">
                <Filter size={14} />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="auto_approved">Auto approved</SelectItem>
                <SelectItem value="auto_rejected">Auto rejected</SelectItem>
                <SelectItem value="overridden">Overridden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Table data-testid="admin-applications-table">
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id} data-testid={`admin-application-row-${application.id}`}>
                  <TableCell data-testid={`admin-application-name-${application.id}`}>
                    {application.full_name}
                  </TableCell>
                  <TableCell className="capitalize" data-testid={`admin-application-loan-${application.id}`}>
                    {application.loan_type}
                  </TableCell>
                  <TableCell data-testid={`admin-application-score-${application.id}`}>
                    {application.weighted_score}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${decisionBadgeClass[application.final_decision]} capitalize`}
                      data-testid={`admin-application-decision-${application.id}`}
                    >
                      {application.final_decision}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusBadgeClass[application.status]} capitalize`}
                      data-testid={`admin-application-status-${application.id}`}
                    >
                      {application.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/applications/${application.id}`)}
                      data-testid={`admin-application-view-${application.id}`}
                    >
                      <Eye size={14} /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
