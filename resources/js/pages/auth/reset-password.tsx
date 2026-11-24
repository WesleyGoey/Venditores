import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordForm {
    token: string;
    password: string;
    password_confirmation: string;
}

export default function ResetPassword() {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: '',
        password: '',
        password_confirmation: '',
    });

    // The Supabase reset link puts the access token in the URL fragment, which never reaches the server.
    useEffect(() => {
        setData('token', new URLSearchParams(window.location.hash.slice(1)).get('access_token') ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Reset password" description="Please enter your new password below">
            <Head title="Reset password" />

            <form onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="password" required>
                            Password
                        </Label>
                        <Input
                            id="password"
                            required
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" required>
                            Confirm password
                        </Label>
                        <Input
                            id="password_confirmation"
                            required
                            type="password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    {errors.token && (
                        <p className="text-destructive text-sm">
                            This reset link is invalid or has expired. <TextLink href={route('password.request')}>Request a new one</TextLink>.
                        </p>
                    )}

                    <Button type="submit" className="mt-4 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Reset password
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
