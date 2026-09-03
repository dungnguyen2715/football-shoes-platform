import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImg from "@/assets/hero.jpg";

export default function Auth() {
  return (
    <div className="grid min-h-[80dvh] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={heroImg} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <p className="display-xl absolute bottom-12 left-12 max-w-sm text-4xl text-white">
          One pair. One owner. One price.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Bootyard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save boots, track requests and get first look at new drops.
        </p>

        <Tabs defaultValue="login" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" className="h-11" placeholder="you@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>
              <Button asChild className="min-h-12 w-full rounded-full">
                <Link to="/account">Sign in</Link>
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-muted-foreground underline"
              >
                Forgot your password?
              </button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full name</Label>
                <Input id="reg-name" className="h-11" placeholder="Alex Turner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" className="h-11" placeholder="you@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  className="h-11"
                  placeholder="At least 8 characters"
                />
              </div>
              <Button asChild className="min-h-12 w-full rounded-full">
                <Link to="/account">Create account</Link>
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["Google", "Apple", "Facebook"].map((p) => (
            <Button key={p} variant="outline" className="min-h-11 rounded-full text-xs">
              {p}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
