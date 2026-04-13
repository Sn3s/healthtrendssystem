import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { authSchema } from '@/lib/validation';

const brandPanelClass =
  'relative hidden overflow-hidden bg-gradient-to-br from-[hsl(172,46%,38%)] via-[hsl(178,44%,34%)] to-[hsl(195,48%,28%)] lg:flex lg:flex-col lg:justify-between lg:p-12';

/** Healthtrends clinic photos — crossfade behind the sign-in column */
const LOGIN_BACKGROUND_IMAGES = ['/login-bg-1.png', '/login-bg-2.png', '/login-bg-3.png'] as const;

const BG_SLIDE_MS = 7000;
const BG_FADE_MS = 2600;

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [bgSlide, setBgSlide] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setBgSlide((i) => (i + 1) % LOGIN_BACKGROUND_IMAGES.length);
    }, BG_SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationData = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, fullName: formData.fullName };

      const validationResult = authSchema.safeParse(validationData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        navigate({ pathname: '/', search: '?tab=registry' });
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Account created! Please check your email to confirm.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] xl:grid-cols-[minmax(0,1fr)_520px]">
      {/* Brand column */}
      <aside className={brandPanelClass}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 22%, white 0, transparent 42%),
              radial-gradient(circle at 82% 12%, white 0, transparent 38%),
              radial-gradient(circle at 72% 78%, white 0, transparent 45%),
              radial-gradient(circle at 12% 88%, white 0, transparent 40%)`,
          }}
        />
        <div className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-1/4 h-56 w-56 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-8 text-center">
          <div className="relative flex h-56 w-56 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-2xl ring-1 ring-white/40 sm:h-64 sm:w-64">
            <img
              src="/healthtrends-logo.png"
              alt="Healthtrends Medical Clinics"
              className="h-full w-full origin-center scale-[1.22] object-contain object-center sm:scale-[1.26]"
              width={256}
              height={256}
              decoding="async"
            />
          </div>
          <div className="max-w-sm space-y-3 text-white">
            <h1 className="text-balance text-3xl font-semibold tracking-tight drop-shadow-sm">Healthtrends Medical Clinics</h1>
            <p className="text-pretty text-base leading-relaxed text-white/90">
              Secure access to your hospital management workspace—registry, roles, and patient care tools in one place.
            </p>
          </div>
        </div>

        <p className="relative z-10 px-8 text-center text-xs font-medium uppercase tracking-widest text-white/55">
          Confidential · Authorized staff only
        </p>
      </aside>

      {/* Form column */}
      <main className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          {LOGIN_BACKGROUND_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              decoding="async"
              fetchPriority={i === 0 ? 'auto' : 'low'}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: bgSlide === i ? 0.5 : 0,
                transition: `opacity ${BG_FADE_MS}ms ease-in-out`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-background/88 via-background/80 to-muted/85" />
          <div className="absolute inset-0 bg-background/45 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md space-y-8">
          {/* Mobile brand */}
          <div className="flex flex-col items-center gap-4 text-center lg:hidden">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-border/60">
              <img
                src="/healthtrends-logo.png"
                alt="Healthtrends Medical Clinics"
                className="h-full w-full origin-center scale-[1.2] object-contain object-center"
                width={144}
                height={144}
                decoding="async"
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Healthtrends Medical Clinics</p>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
            </div>
          </div>

          <Card className="border-border/60 shadow-xl shadow-primary/5 ring-1 ring-border/40">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription className="text-base">
                {isLogin
                  ? 'Enter your credentials to access the dashboard.'
                  : 'Add your details to get started. You will confirm by email.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      autoComplete="name"
                      className="h-11 rounded-lg border-border/80 bg-background/80 transition-shadow focus-visible:ring-primary/30"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@clinic.org"
                    autoComplete="email"
                    className="h-11 rounded-lg border-border/80 bg-background/80 transition-shadow focus-visible:ring-primary/30"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="h-11 rounded-lg border-border/80 bg-background/80 transition-shadow focus-visible:ring-primary/30"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full rounded-lg text-base font-semibold shadow-md" disabled={loading}>
                  {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
                </Button>

                <div className="relative py-1 text-center">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                  <span className="relative inline-block bg-card px-3 text-xs text-muted-foreground">or</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="w-full text-center text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
