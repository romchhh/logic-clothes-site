import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  actions?: React.ReactNode;
  /** Anchor for section jump nav */
  sectionId?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  actions,
  sectionId,
}) => {
  return (
    <section
      id={sectionId}
      className={`admin-panel scroll-mt-28 sm:scroll-mt-32 ${className}`}
    >
      <div className="admin-panel-head">
        <div className="min-w-0">
          <h3 className="admin-panel-title">{title}</h3>
          {desc ? (
            <p className="admin-panel-desc hidden sm:block">{desc}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="p-3.5 sm:p-5 md:p-6">
        <div className="space-y-4 sm:space-y-5">{children}</div>
      </div>
    </section>
  );
};

export default ComponentCard;
