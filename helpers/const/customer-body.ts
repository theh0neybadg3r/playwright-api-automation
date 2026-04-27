import {
    fakerEN,
    fakerEN_AU,
    fakerEN_IN,
    fakerID_ID,
    fakerTH,
    fakerVI,
    fakerKO,
    fakerJA,
    fakerBN_BD,
    type Faker
} from '@faker-js/faker'

export interface CustomerBody {
    address_line_1: string;
    address_line_2: string;
    city: string;
    country: string
    email: string;
    first_name: string;
    last_name: string;
    mobile: string;
    state: string;
    zip: string;
}

export type SupportedCountry = 'PH' | 'ID' | 'TH' | 'VN' | 'MY' | 'BD' | 'KR' | 'IN' | 'JP' | 'AU';

const digits = (value: string): string => value.replace(/\D/g, '');

const phoneNumberNormalizer: Record<SupportedCountry, (raw: string) => string> = {

    // PH: 10-digit local number → +63XXXXXXXXXX (drop leading 0 if present)
    PH: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-10);
        return `+63${d}`;
    },

    // ID: 9–12 digit local number → +62XXXXXXXXXX
    ID: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-11);
        return `+62${d}`;
    },
    // TH: 9-digit local → +66XXXXXXXXX
    TH: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-9);
        return `+66${d}`;
    },
    // VN: 9-digit local → +84XXXXXXXXX
    VN: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-9);
        return `+84${d}`;
    },
    // MY: 9–10 digit local → +60XXXXXXXXXX
    MY: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-10);
        return `+60${d}`;
    },
    // BD: 10-digit local → +880XXXXXXXXXX
    BD: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-10);
        return `+880${d}`;
    },
    // KR: 10-digit local → +82XXXXXXXXXX
    KR: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-10);
        return `+82${d}`;
    },
    // IN: 10-digit local → +91XXXXXXXXXX
    IN: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-10);
        return `+91${d}`;
    },
    // JP: 10-digit local → +81XXXXXXXXXX
    JP: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-10);
        return `+81${d}`;
    },
    // AU: 9-digit local → +61XXXXXXXXX
    AU: (raw) => {
        const d = digits(raw).replace(/^0/, '').slice(-9);
        return `+61${d}`;
    }
};

interface LocaleConfig {
    faker: Faker;
    countryCode: SupportedCountry;
}

const LOCALE_MAP: Record<SupportedCountry, LocaleConfig> = {
    PH: { faker: fakerEN,    countryCode: 'PH' },   // no fakerEN_PH locale in Faker
    ID: { faker: fakerID_ID, countryCode: 'ID' },
    TH: { faker: fakerTH,    countryCode: 'TH' },
    VN: { faker: fakerVI,    countryCode: 'VN' },
    MY: { faker: fakerEN,    countryCode: 'MY' },   // no fakerMS_MY locale in Faker
    BD: { faker: fakerBN_BD, countryCode: 'BD' },
    KR: { faker: fakerKO,    countryCode: 'KR' },
    IN: { faker: fakerEN_IN, countryCode: 'IN' },
    JP: { faker: fakerJA,    countryCode: 'JP' },
    AU: { faker: fakerEN_AU, countryCode: 'AU' }
}

export const getCustomerBody = (country: SupportedCountry): CustomerBody => {
    const { faker, countryCode } = LOCALE_MAP[country];
    const normalizePhoneNumbers = phoneNumberNormalizer[countryCode];

    return {
        address_line_1: faker.location.streetAddress(),
        address_line_2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        country: countryCode,
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        mobile: normalizePhoneNumbers(faker.phone.number()),
        state: faker.location.state(),
        zip: faker.location.zipCode()
    };
};

//Pre-built body for different customers around the world with Philippines as default 
export const BODY_CUSTOMER_DEFAULT: CustomerBody = getCustomerBody('PH');
export const BODY_CUSTOMER_INDONESIA:  CustomerBody = getCustomerBody('ID');
export const BODY_CUSTOMER_THAILAND:   CustomerBody = getCustomerBody('TH');
export const BODY_CUSTOMER_VIETNAM:    CustomerBody = getCustomerBody('VN');
export const BODY_CUSTOMER_MALAYSIA:   CustomerBody = getCustomerBody('MY');
export const BODY_CUSTOMER_BANGLADESH: CustomerBody = getCustomerBody('BD');
export const BODY_CUSTOMER_KOREA:      CustomerBody = getCustomerBody('KR');
export const BODY_CUSTOMER_INDIA:      CustomerBody = getCustomerBody('IN');
export const BODY_CUSTOMER_JAPAN:      CustomerBody = getCustomerBody('JP');
export const BODY_CUSTOMER_AUSTRALIA:  CustomerBody = getCustomerBody('AU');
