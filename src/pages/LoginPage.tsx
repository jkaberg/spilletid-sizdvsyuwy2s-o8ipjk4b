import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { auth } from '@/lib/auth';
import { useTranslation } from '@/lib/translations';
export function LoginPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('trener@heimdal.no');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const from = location.state?.from?.pathname || '/';
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await auth.login(email, password);
      toast.success(t('login.success'));
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="py-8 md:py-10 lg:py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="w-full max-w-md mx-auto shadow-2xl">
                <CardHeader className="text-center">
                  <svg width="64" height="64" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4 rounded-full" aria-label="Heimdal Fotball Logo">
                    <rect width="100" height="100" fill="#006400"/>
                    <text x="50" y="65" textAnchor="middle" fill="#DC143C" fontSize="40" fontWeight="bold" fontFamily="Inter, sans-serif">H-F</text>
                    <circle cx="50" cy="20" r="8" fill="#FFD700"/>
                  </svg>
                  <div className="inline-block mx-auto bg-gradient-to-r from-heimdal-green to-heimdal-red p-3 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold mt-4">{t('login.title')}</CardTitle>
                  <CardDescription>{t('login.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-6" lang={language}>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('login.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="trener@heimdal.no"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('login.password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-heimdal-green hover:bg-heimdal-red text-white" disabled={isLoading}>
                      {isLoading ? t('login.loading') : t('login.submit')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}