import { NextResponse } from 'next/server';

const firstNames = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Katherine', 'Barbara', 'Ken'];
const lastNames = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Turing', 'Johnson', 'Liskov', 'Thompson'];
const streets = ['Orbit Avenue', 'Vector Street', 'Signal Road', 'Latency Lane', 'Harbor Drive'];
const cities = ['Madrid', 'Lisbon', 'Berlin', 'Valencia', 'Amsterdam', 'Paris'];
const countries = ['Spain', 'Portugal', 'Germany', 'France', 'Netherlands'];
const companies = ['Aero Labs', 'StreamWorks', 'Cloud Vector', 'Session Forge', 'Pilot Systems'];

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)] ?? items[0] ?? '';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(): Promise<NextResponse> {
  const delayMs = 1000 + Math.floor(Math.random() * 4001);
  await wait(delayMs);

  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const city = pick(cities);
  const country = pick(countries);
  const company = pick(companies);

  return NextResponse.json({
    firstName,
    lastName,
    address: `${100 + Math.floor(Math.random() * 900)} ${pick(streets)}`,
    city,
    country,
    email: `${firstName}.${lastName}@example.test`.toLowerCase(),
    phone: `+34 6${Math.floor(10000000 + Math.random() * 89999999)}`,
    company,
    delayMs,
    requestedAt: new Date().toISOString(),
  });
}
