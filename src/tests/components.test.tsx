import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardTitle } from "../components/ui/card";

describe("UI Design System & Accessibility Components", () => {
  it("renders Button with accessible text and elder-friendly sizing", () => {
    const { getByRole } = render(<Button variant="elder-action">Take Morning Dose</Button>);
    const btn = getByRole("button", { name: /Take Morning Dose/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("min-h-[56px]");
  });

  it("disables Button when isLoading is true and shows accessible loading indicator", () => {
    const { getByRole, getByText } = render(<Button isLoading>Submit</Button>);
    const btn = getByRole("button");
    expect(btn).toBeDisabled();
    expect(getByText(/Loading\.\.\./i)).toBeInTheDocument();
  });

  it("renders Badge with appropriate styling variant", () => {
    const { getByText } = render(<Badge variant="teal">Prescription Active</Badge>);
    const badge = getByText("Prescription Active");
    expect(badge).toBeInTheDocument();
  });

  it("renders Card with high-contrast title", () => {
    const { getByText } = render(
      <Card>
        <CardTitle>Daily Regimen</CardTitle>
      </Card>
    );
    expect(getByText("Daily Regimen")).toBeInTheDocument();
  });
});
