"use client";
import { useState } from "react";
import { STAGES as FALLBACK_STAGES, STAGE_COLORS, stageStyle } from "../lib/stages";

function today() {
  return new Date().toISOString().split("T")[0];
}
function isOverdue(d) {
  return d && d.split("T")[0] < today();
}
function isToday(d) {
  return d && d.split("T")[0] === today();
}
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function KanbanBoard({ leads, stages = [], onStageChange, onEdit, employeeNames, currentUserId }) {
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const stageList = stages.length ? stages.map(s => s.name) : FALLBACK_STAGES;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        overflowX: "auto",
        paddingBottom: 12,
      }}
    >
      {stageList.map((stage) => {
        const sc = stageStyle(stage, stages);
        const stageLeads = leads.filter((l) => l.stage === stage);
        const isDropTarget = overStage === stage;
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOverStage(null);
              const lead = leads.find((l) => String(l.id) === dragId);
              if (lead && lead.stage !== stage) onStageChange(lead, stage);
              setDragId(null);
            }}
            style={{
              flex: "0 0 260px",
              background: "var(--bg-surface)",
              border: `1px solid ${isDropTarget ? sc.color : "var(--border)"}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 220px)",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-main)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: sc.color,
                }}
              >
                {stage}
              </span>
              <span
                style={{
                  background: sc.bg,
                  color: sc.color,
                  borderRadius: 20,
                  padding: "1px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {stageLeads.length}
              </span>
            </div>

            <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
              {stageLeads.length === 0 ? (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    textAlign: "center",
                    padding: "18px 0",
                  }}
                >
                  No leads
                </div>
              ) : (
                stageLeads.map((lead) => {
                  const termIdx = stageList.length - 1;
                  const over = isOverdue(lead.follow_up_date) && stage !== stageList[termIdx] && stage !== stageList[termIdx - 1];
                  const tod = isToday(lead.follow_up_date);
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDragId(String(lead.id))}
                      onClick={() => onEdit(lead)}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 9,
                        padding: "10px 12px",
                        marginBottom: 8,
                        cursor: "grab",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-main)",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                        }}
                      >
                        {lead.name}
                      </div>
                      {lead.last_message && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: 6,
                          }}
                        >
                          {lead.last_message}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        {lead.follow_up_date ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: over ? "var(--danger)" : tod ? "var(--warn)" : "var(--text-muted)",
                            }}
                          >
                            {over ? "⚠ " : tod ? "● " : ""}
                            {fmtDate(lead.follow_up_date)}
                          </span>
                        ) : (
                          <span />
                        )}
                        {lead.assigned_to && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--teal-light)",
                              background: "var(--teal-dim)",
                              borderRadius: 10,
                              padding: "1px 7px",
                            }}
                          >
                            {employeeNames?.[lead.assigned_to] ||
                              (lead.assigned_to === currentUserId ? "You" : "Assigned")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
