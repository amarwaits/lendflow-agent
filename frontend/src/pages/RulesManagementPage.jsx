import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { api, authHeaders } from "@/lib/api";

const fields = [
  "min_credit_score",
  "max_dti",
  "approval_score",
  "review_score",
  "weight_credit",
  "weight_income",
  "weight_dti",
  "weight_employment",
];

export default function RulesManagementPage() {
  const [rules, setRules] = useState([]);
  const [savingLoanType, setSavingLoanType] = useState("");

  const fetchRules = async () => {
    try {
      const response = await api.get("/admin/rules", { headers: authHeaders() });
      setRules(response.data);
    } catch {
      toast.error("Failed to load underwriting rules.");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const updateField = (loanType, field, value) => {
    setRules((previous) =>
      previous.map((rule) =>
        rule.loan_type === loanType
          ? {
              ...rule,
              [field]: value,
            }
          : rule,
      ),
    );
  };

  const saveRule = async (rule) => {
    setSavingLoanType(rule.loan_type);

    try {
      await api.put(
        `/admin/rules/${rule.loan_type}`,
        {
          min_credit_score: Number(rule.min_credit_score),
          max_dti: Number(rule.max_dti),
          approval_score: Number(rule.approval_score),
          review_score: Number(rule.review_score),
          weight_credit: Number(rule.weight_credit),
          weight_income: Number(rule.weight_income),
          weight_dti: Number(rule.weight_dti),
          weight_employment: Number(rule.weight_employment),
          use_ai_model: Boolean(rule.use_ai_model),
        },
        { headers: authHeaders() },
      );

      toast.success(`${rule.loan_type} rule updated.`);
      fetchRules();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Rule update failed.");
    } finally {
      setSavingLoanType("");
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-rules-page">
      <header className="space-y-3" data-testid="admin-rules-header">
        <h1 className="text-4xl sm:text-5xl" data-testid="admin-rules-heading">
          Underwriting Rules
        </h1>
        <p className="text-sm md:text-base text-muted-foreground" data-testid="admin-rules-description">
          Adjust weighted scoring and threshold logic for each loan category.
        </p>
      </header>

      <div className="grid xl:grid-cols-3 gap-5" data-testid="admin-rules-grid">
        {rules.map((rule) => (
          <Card key={rule.loan_type} data-testid={`admin-rule-card-${rule.loan_type}`}>
            <CardHeader>
              <CardTitle className="capitalize" data-testid={`admin-rule-title-${rule.loan_type}`}>
                {rule.loan_type} loan rule
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium" htmlFor={`${rule.loan_type}_use_ai`}>
                    AI Underwriting
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use LightGBM model; falls back to rules if unavailable
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.use_ai_model ? "default" : "secondary"} className="text-xs">
                    {rule.use_ai_model ? "AI" : "Rules"}
                  </Badge>
                  <Switch
                    id={`${rule.loan_type}_use_ai`}
                    checked={Boolean(rule.use_ai_model)}
                    onCheckedChange={(checked) => updateField(rule.loan_type, "use_ai_model", checked)}
                    data-testid={`admin-rule-${rule.loan_type}-use-ai-toggle`}
                  />
                </div>
              </div>

              {fields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label className="capitalize" htmlFor={`${rule.loan_type}_${field}`}>
                    {field.replaceAll("_", " ")}
                  </Label>
                  <Input
                    id={`${rule.loan_type}_${field}`}
                    type="number"
                    step={field.includes("weight") ? "0.01" : "0.1"}
                    value={rule[field]}
                    onChange={(event) => updateField(rule.loan_type, field, event.target.value)}
                    data-testid={`admin-rule-${rule.loan_type}-${field}-input`}
                  />
                </div>
              ))}

              <Button
                className="w-full mt-2"
                onClick={() => saveRule(rule)}
                disabled={savingLoanType === rule.loan_type}
                data-testid={`admin-rule-save-${rule.loan_type}`}
              >
                {savingLoanType === rule.loan_type ? "Saving..." : "Save rule"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
