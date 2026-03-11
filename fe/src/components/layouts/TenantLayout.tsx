import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Sparkles, 
  Users, 
  User, 
  LogOut,
  Menu,
  Bell,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TenantLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Trang chủ', href: '/tenant/dashboard', icon: Home },
  { label: 'Tìm phòng', href: '/tenant/find-room', icon: Search },
  { label: 'AI Trợ lý', href: '/tenant/ai-search', icon: Sparkles, badge: 'Pro' },
  { label: 'Tìm bạn ở ghép', href: '/tenant/roommates', icon: Users },
  { label: 'Hồ sơ', href: '/tenant/profile', icon: User },
];

function NavLink({
  item,
  isActive,
  avatarUrl,
  fallbackLabel,
}: {
  item: typeof navItems[0];
  isActive: boolean;
  avatarUrl?: string;
  fallbackLabel?: string;
}) {
  const Icon = item.icon;
  const isProfile = item.href === '/tenant/profile';

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
        isActive
          ? 'bg-primary text-primary-foreground shadow-card'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {isProfile ? (
        <Avatar className="h-5 w-5">
          <AvatarImage src={avatarUrl} alt="avatar" />
          <AvatarFallback className="text-[10px]">{fallbackLabel ?? 'U'}</AvatarFallback>
        </Avatar>
      ) : (
        <Icon className="h-5 w-5" />
      )}
      <span className="font-medium">{item.label}</span>
      {item.badge && (
        <Badge variant="secondary" className="ml-auto text-xs bg-accent text-accent-foreground">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    if (!loading && (!user || role !== 'tenant')) {
      navigate('/auth/login?role=tenant');
    }
  }, [user, role, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-1 flex-col gap-y-4 border-r border-border bg-card px-4 py-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 px-4 mb-4">
            <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center shadow-card">
              <span className="text-primary-foreground font-bold">KK</span>
            </div>
            <span className="font-bold text-xl gradient-text">KnockKnock</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={location.pathname === item.href}
                avatarUrl={user?.avatarUrl}
                fallbackLabel={user?.fullName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase()}
              />
            ))}
          </nav>

          {/* User info + Sign Out */}
          <div className="space-y-1 border-t border-border pt-4">
            <div className="flex items-center gap-3 px-4 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.avatarUrl} alt="avatar" />
                <AvatarFallback className="text-xs">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.fullName ?? 'Người dùng'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full px-4 py-6">
                <Link to="/" className="flex items-center gap-2 px-4 mb-6">
                  <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">KK</span>
                  </div>
                  <span className="font-bold text-xl gradient-text">KnockKnock</span>
                </Link>

                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={location.pathname === item.href}
                      avatarUrl={user?.avatarUrl}
                      fallbackLabel={user?.fullName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase()}
                    />
                  ))}
                </nav>

                <div className="space-y-1 border-t border-border pt-4">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user?.avatarUrl} alt="avatar" />
                      <AvatarFallback className="text-xs">
                        {user?.fullName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user?.fullName ?? 'Người dùng'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">KK</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>
            <Link to="/tenant/profile">
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
                <AvatarImage src={user?.avatarUrl} alt="avatar" />
                <AvatarFallback className="text-xs gradient-bg text-primary-foreground">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}


