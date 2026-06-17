import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui'

export function Single() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1" style={{ width: 460 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is your refund policy?</AccordionTrigger>
        <AccordionContent>
          We offer a 30-day money-back guarantee on all paid plans, no questions
          asked.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Can I change plans later?</AccordionTrigger>
        <AccordionContent>
          Yes — you can upgrade or downgrade at any time from your billing
          settings.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Do you offer team discounts?</AccordionTrigger>
        <AccordionContent>
          Teams of 10 or more qualify for volume pricing. Contact sales for a
          quote.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function Multiple() {
  return (
    <Accordion
      type="multiple"
      defaultValue={['a', 'b']}
      style={{ width: 460 }}
    >
      <AccordionItem value="a">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Free standard shipping on orders over $50.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Return any item within 30 days of delivery.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
