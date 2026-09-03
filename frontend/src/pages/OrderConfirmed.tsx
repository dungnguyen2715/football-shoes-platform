import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Confirmed() {
  return (
    <div className="mx-auto grid max-w-lg place-items-center px-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
        <CheckCircle2 className="size-8" />
      </span>
      <p className="eyebrow mt-6">Order BY-2042</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Request received</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your pair is now on hold. The shop owner has been notified and will message you on your
        preferred channel — usually within a couple of hours — to confirm sizing, payment and
        delivery.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-12 rounded-full px-6">
          <Link to="/shop">Keep browsing</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-12 rounded-full px-6">
          <Link to="/account">View my orders</Link>
        </Button>
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <MessageCircle className="size-4" /> Need us sooner? DM @bootyard.au on Instagram.
      </p>
    </div>
  );
}
