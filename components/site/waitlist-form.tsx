import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { PAID_CHARTS } from "./paid-previews"

/**
 * A plain HTML form that posts to an email tool. Set WAITLIST_FORM_ACTION to the
 * Buttondown embed URL: https://buttondown.com/api/emails/embed-subscribe/<username>
 * Buttondown saves the chosen chart as a tag on the subscriber.
 */
export function WaitlistForm() {
  const action = process.env.WAITLIST_FORM_ACTION

  return (
    <form action={action} method="post" target="_blank" className="grid gap-5">
      <fieldset className="grid gap-2" disabled={!action}>
        <legend className="mb-2 text-sm font-medium">Which chart do you need most?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAID_CHARTS.map(({ id, name }, i) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-ring has-checked:bg-muted/60"
            >
              <input type="radio" name="tag" value={id} defaultChecked={i === 0} className="accent-brand" />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2" disabled={!action}>
        <label htmlFor="waitlist-email" className="text-sm font-medium">
          Email
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="waitlist-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="sm:flex-1"
          />
          <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
            Join the waitlist
          </Button>
        </div>
      </fieldset>
      <p className="text-sm text-pretty text-muted-foreground">
        {action
          ? "One email when the pack is ready, with the $59 waitlist price. No spam."
          : "The waitlist opens soon."}
      </p>
    </form>
  )
}
