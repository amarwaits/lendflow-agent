import { useState } from "react";
import { Building2, Car, ChevronRight, Landmark, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";

const loanOptions = [
  {
    id: "home",
    title: "Home Loan",
    icon: Building2,
    image:
      "https://images.unsplash.com/photo-1760072513442-9872656c1b07?auto=format&fit=crop&w=1200&q=80",
    description: "Mortgage and refinancing for your dream home.",
  },
  {
    id: "car",
    title: "Car Loan",
    icon: Car,
    image:
      "https://images.unsplash.com/photo-1587350855660-86c85419a884?auto=format&fit=crop&w=1200&q=80",
    description: "Simple financing for your next ride.",
  },
  {
    id: "personal",
    title: "Personal Loan",
    icon: Landmark,
    image:
      "https://images.unsplash.com/photo-1598276489564-af294f3e8fa4?auto=format&fit=crop&w=1200&q=80",
    description: "Flexible cash for your important life goals.",
  },
];

const defaultForm = {
  loan_type: "home",
  full_name: "",
  email: "",
  phone: "",
  annual_income: "",
  loan_amount: "",
  credit_score: "",
  monthly_debt: "",
  employment_years: "",
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        annual_income: Number(form.annual_income),
        loan_amount: Number(form.loan_amount),
        credit_score: Number(form.credit_score),
        monthly_debt: Number(form.monthly_debt),
        employment_years: Number(form.employment_years),
      };

      const response = await api.post("/applications", payload);
      toast.success("Application submitted successfully.");
      navigate(`/submitted/${response.data.id}`);
    } catch (error) {
      const detail = error.response?.data?.detail;
      let message = "Unable to submit application";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail
          .map((e) => {
            const field = Array.isArray(e.loc) && e.loc.length > 0
              ? e.loc[e.loc.length - 1]
                  .toString()
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : null;
            return field ? `${field}: ${e.msg}` : e.msg;
          })
          .join(". ");
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12 space-y-14" data-testid="onboarding-page">
      <header className="space-y-8 soft-rise" data-testid="onboarding-hero-section">
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80" data-testid="onboarding-brand">
            LendFlow Digital Onboarding
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/architecture")}
              data-testid="onboarding-architecture-link"
            >
              Architecture
            </Button>
            <Button onClick={() => navigate("/admin/login")} data-testid="onboarding-admin-login-link">
              Admin Login
            </Button>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight" data-testid="onboarding-main-heading">
          Quick loan onboarding for home, car, and personal financing.
        </h1>

        <p className="text-sm md:text-base text-muted-foreground max-w-3xl" data-testid="onboarding-main-description">
          Apply online in minutes. Our backend underwriting engine calculates a weighted eligibility score using
          income, credit profile, debt ratio, and employment stability.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-6 soft-rise stagger-1" data-testid="loan-type-selection-grid">
        {loanOptions.map((option) => {
          const Icon = option.icon;
          const active = form.loan_type === option.id;
          return (
            <button
              key={option.id}
              onClick={() => updateField("loan_type", option.id)}
              className={`text-left overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 ${
                active ? "border-primary shadow-md" : "border-border"
              }`}
              data-testid={`loan-option-${option.id}-button`}
              type="button"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={option.image}
                  alt={option.title}
                  className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                  data-testid={`loan-option-${option.id}-image`}
                />
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-semibold" data-testid={`loan-option-${option.id}-title`}>
                    {option.title}
                  </h2>
                  <Icon size={18} />
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`loan-option-${option.id}-description`}>
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      <Card className="border-border shadow-sm soft-rise stagger-2" data-testid="application-form-card">
        <CardHeader>
          <CardTitle className="text-2xl" data-testid="application-form-heading">
            Applicant details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitApplication} className="grid md:grid-cols-2 gap-6" data-testid="application-form">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                required
                data-testid="application-full-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                data-testid="application-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
                data-testid="application-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_income">Annual Income (USD)</Label>
              <Input
                id="annual_income"
                type="number"
                min="1"
                value={form.annual_income}
                onChange={(e) => updateField("annual_income", e.target.value)}
                required
                data-testid="application-annual-income-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan_amount">Requested Loan Amount (USD)</Label>
              <Input
                id="loan_amount"
                type="number"
                min="1"
                value={form.loan_amount}
                onChange={(e) => updateField("loan_amount", e.target.value)}
                required
                data-testid="application-loan-amount-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_score">Credit Score</Label>
              <Input
                id="credit_score"
                type="number"
                min="300"
                max="900"
                value={form.credit_score}
                onChange={(e) => updateField("credit_score", e.target.value)}
                required
                data-testid="application-credit-score-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_debt">Monthly Existing Debt (USD)</Label>
              <Input
                id="monthly_debt"
                type="number"
                min="0"
                value={form.monthly_debt}
                onChange={(e) => updateField("monthly_debt", e.target.value)}
                required
                data-testid="application-monthly-debt-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_years">Employment Duration (Years)</Label>
              <Input
                id="employment_years"
                type="number"
                min="0"
                step="0.5"
                value={form.employment_years}
                onChange={(e) => updateField("employment_years", e.target.value)}
                required
                data-testid="application-employment-years-input"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={loading} data-testid="application-submit-button">
                {loading ? "Submitting..." : "Submit application"}
                <ChevronRight size={16} />
              </Button>
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid="application-security-note">
                <ShieldCheck size={16} /> Your data is processed securely for underwriting review.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
