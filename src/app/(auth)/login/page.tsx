
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';
import { Logo } from '@/components/common/Logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }), // Simplified for prototype
  role: z.enum(['Admin', 'QuotationCreator', 'BookingCreator', 'Reviewer'], {
    required_error: 'You need to select a role.',
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const roles: UserRole[] = ['Admin', 'QuotationCreator', 'BookingCreator', 'Reviewer'];

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      role: undefined,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    const success = await login(data.email, data.password, data.role as UserRole);
    if (success) {
      toast({ title: 'Login Successful', description: `Welcome back, ${data.role}!` });
      router.push('/dashboard');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials or role. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-4"
      style={{ '--primary': 'hsl(346 66% 44%)' }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo size="lg" className="mb-4" />
          <CardTitle className="text-3xl font-bold">Login</CardTitle>
          <CardDescription className="text-md" style={{ color: '#4A0E6A' }}>Streamline your freight operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                {isSubmitting || authLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="mt-4 justify-center">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Cargoly</p>
        </CardFooter>
      </Card>
    </div>
  );
}
