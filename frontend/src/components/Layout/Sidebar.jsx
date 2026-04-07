import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Bookmark, Search } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/literature" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={18} />
          <span>Literature</span>
        </NavLink>
        <NavLink to="/bookmarks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Bookmark size={18} />
          <span>Bookmarks</span>
        </NavLink>
      </nav>
    </aside>
  );
}
