import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { PasswordInput } from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface RegisterForm {
    account_type: 'user' | 'vendor';
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        account_type: 'user',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <fieldset className="grid gap-2">
                        <legend className="mb-2 text-sm font-medium">I am</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {(
                                [
                                    ['user', 'Planning an event', 'Find vendors and compare offers'],
                                    ['vendor', 'A vendor', 'List my vendor and read its reviews'],
                                ] as const
                            ).map(([value, title, hint]) => (
                                <label
                                    key={value}
                                    className="border-foreground/15 has-[:checked]:border-foreground has-[:focus-visible]:ring-ring flex cursor-pointer flex-col gap-0.5 rounded-lg border bg-white/30 px-3 py-2.5 text-sm has-[:checked]:bg-white/60 has-[:focus-visible]:ring-2"
                                >
                                    <span className="flex items-center gap-2 font-medium">
                                        <input
                                            type="radio"
                                            name="account_type"
                                            value={value}
                                            checked={data.account_type === value}
                                            onChange={() => setData('account_type', value)}
                                            className="accent-foreground"
                                            tabIndex={1}
                                        />
                                        {title}
                                    </span>
                                    <span className="text-muted-foreground pl-6 text-xs">{hint}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.account_type} />
                    </fieldset>

                    <div className="grid gap-2">
                        <Label htmlFor="name" required>
                            Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" required>
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password" required>
                            Password
                        </Label>
                        <PasswordInput
                            id="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" required>
                            Confirm password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button type="submit" className="mt-2 w-full" tabIndex={5} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Create account
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
