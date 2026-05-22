import { NavLink, Outlet } from "react-router-dom";
import "../App.css";

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/add", label: "Add expense" },
  { to: "/categories", label: "Categories" },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Expense Tracker</div>
        <div className="sidebar-tagline">Personal finance</div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">Phase 1</div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
