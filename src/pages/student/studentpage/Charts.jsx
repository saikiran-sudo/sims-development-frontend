import React from "react";
import { ProgressBar as BSProgressBar } from "react-bootstrap";

export const ProgressBar = ({ course, progress, variant = "primary", showLabel = true }) => (
  <div className="mb-3">
    <div className="d-flex justify-content-between mb-1 small text-muted">
      {course && <span className="fw-semibold text-dark">{course}</span>}
      {showLabel && <span className="fw-bold text-dark">{progress}%</span>}
    </div>
    <BSProgressBar
      now={progress}
      variant={variant}
      className="rounded-pill"
      style={{ height: '8px' }}
    />
  </div>
);