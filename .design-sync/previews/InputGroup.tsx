import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@workspace/ui'
import { SearchIcon } from 'lucide-react'

export function WithIcon() {
  return (
    <InputGroup style={{ width: 320 }}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search projects…" />
    </InputGroup>
  )
}

export function WithPrefix() {
  return (
    <InputGroup style={{ width: 320 }}>
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="your-site.com" />
    </InputGroup>
  )
}

export function WithButton() {
  return (
    <InputGroup style={{ width: 320 }}>
      <InputGroupInput placeholder="Enter coupon code" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="default">Apply</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
