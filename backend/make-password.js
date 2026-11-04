const bcrypt = require("bcrypt");

async function makePassword() {
    const password = "admin123";
    const hash = await bcrypt.hash(password, 10);

    console.log(hash);
}

makePassword();