import { faker } from "@faker-js/faker";

const departments = [];
for (let i = 0; i < 100; i++) {
  departments.push(i);
}

for (let i = 0; i < 100; i++) {
  console.log();
  const response = await fetch("http://localhost:8080/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsImV4cCI6MTc1NDkzNDQ5Mn0.uRb-vC3dHlRpfaTpnCnoSXGew7Vu40MuNK-IPxyQol4",
    },
    body: JSON.stringify({
      "firstname": faker.person.firstName(),
      "lastname": faker.person.lastName(),
      "login": faker.person.middleName(),
      "email": faker.internet.email(),
      "role": faker.helpers.arrayElement(["volunteer"]),
      "departments": faker.helpers.arrayElements(departments, {
        max: 3,
        min: 0,
      }),
      "password": faker.internet.password(),
    }),
  });
}
