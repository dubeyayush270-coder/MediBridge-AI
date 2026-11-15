import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardTitle, CardContent, CardFooter } from "../components/ui/card";

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

  it("renders CardContent children, buttons, and forwards props correctly (no dropped children)", () => {
    const { getByText, getByRole, getByTestId } = render(
      <Card>
        <CardContent className="custom-card-content" data-testid="appointment-details">
          <p>Dr. Robert Chen, MD — Cardiology</p>
          <button type="button">Edit Visit</button>
        </CardContent>
      </Card>
    );

    const details = getByTestId("appointment-details");
    expect(details).toBeInTheDocument();
    expect(details.className).toContain("custom-card-content");
    expect(getByText("Dr. Robert Chen, MD — Cardiology")).toBeInTheDocument();
    expect(getByRole("button", { name: "Edit Visit" })).toBeInTheDocument();
  });

  it("renders CardFooter children and buttons correctly", () => {
    const { getByRole } = render(
      <Card>
        <CardFooter className="custom-footer">
          <button type="button">Delete Regimen</button>
        </CardFooter>
      </Card>
    );
    expect(getByRole("button", { name: "Delete Regimen" })).toBeInTheDocument();
  });
});
