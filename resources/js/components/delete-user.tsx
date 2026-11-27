import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';


// Components...
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


import HeadingSmall from '@/components/heading-small';


import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });


    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();


        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };


    const closeModal = () => {
        clearErrors();
        reset();
    };


    return (
        <div className="space-y-6">
            <HeadingSmall
                title="Delete account"
                description="Removes your login, every event with its vendor needs and quotes, and the vendor reviews you wrote. It cannot be undone."
            />
            <div className="border-destructive/30 space-y-4 rounded-lg border p-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="text-destructive hover:text-destructive">
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Delete your account for good?</DialogTitle>
                        <DialogDescription>
                            Your events, vendor needs, quotes and reviews are deleted with it, and you will be logged out. Type your password to
                            confirm.
                        </DialogDescription>
                        <form className="space-y-6" onSubmit={deleteUser}>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>


                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoComplete="current-password"
                                />


                                <InputError message={errors.password} />
                            </div>


                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                </DialogClose>


                                <Button variant="destructive" disabled={processing} asChild>
                                    <button type="submit">Delete my account</button>
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
