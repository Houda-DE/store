import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { countries, cities } from './schema';

const SEED_DATA: { name: string; code: string; cities: string[] }[] = [
  {
    name: 'Algeria',
    code: 'DZ',
    cities: [
      'Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida',
      'Batna', 'Sétif', 'Djelfa', 'Biskra', 'Sidi Bel Abbès',
      'Tlemcen', 'Béjaïa', 'Skikda', 'Chlef', 'Jijel',
      'Tiaret', 'Mostaganem', 'Ouargla', 'Médéa', 'Tizi Ouzou',
    ],
  },
  {
    name: 'Morocco',
    code: 'MA',
    cities: [
      'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir',
      'Tangier', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan',
      'El Jadida', 'Safi', 'Béni Mellal', 'Errachidia', 'Taza',
      'Nador', 'Settat', 'Berrechid', 'Khouribga', 'Larache',
    ],
  },
  {
    name: 'Tunisia',
    code: 'TN',
    cities: [
      'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabès',
      'Kairouan', 'Ariana', 'Gafsa', 'Médenine', 'Monastir',
      'Nabeul', 'Ben Arous', 'Kasserine', 'Jendouba', 'Tataouine',
      'Sidi Bouzid', 'Siliana', 'Tozeur', 'Zaghouan', 'Mahdia',
    ],
  },
  {
    name: 'France',
    code: 'FR',
    cities: [
      'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice',
      'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille',
      'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon',
      'Grenoble', 'Dijon', 'Nîmes', 'Angers', 'Brest',
    ],
  },
  {
    name: 'Germany',
    code: 'DE',
    cities: [
      'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt',
      'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
      'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg',
      'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
    ],
  },
  {
    name: 'Spain',
    code: 'ES',
    cities: [
      'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza',
      'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
      'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón',
      'Hospitalet', 'Vitoria', 'La Coruña', 'Granada', 'Elche',
    ],
  },
  {
    name: 'Italy',
    code: 'IT',
    cities: [
      'Rome', 'Milan', 'Naples', 'Turin', 'Palermo',
      'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania',
      'Venice', 'Verona', 'Messina', 'Padua', 'Trieste',
      'Taranto', 'Brescia', 'Parma', 'Reggio Calabria', 'Modena',
    ],
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    cities: [
      'London', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield',
      'Bradford', 'Manchester', 'Edinburgh', 'Liverpool', 'Bristol',
      'Cardiff', 'Leicester', 'Coventry', 'Nottingham', 'Hull',
      'Newcastle', 'Belfast', 'Southampton', 'Oxford', 'Cambridge',
    ],
  },
  {
    name: 'United States',
    code: 'US',
    cities: [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
      'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
      'Indianapolis', 'San Francisco', 'Seattle', 'Denver', 'Boston',
    ],
  },
  {
    name: 'Canada',
    code: 'CA',
    cities: [
      'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton',
      'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
      'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor',
      'Saskatoon', 'Regina', 'Kelowna', 'Abbotsford', 'Barrie',
    ],
  },
  {
    name: 'Brazil',
    code: 'BR',
    cities: [
      'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
      'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre',
      'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís',
      'Maceió', 'Natal', 'Teresina', 'Campo Grande', 'João Pessoa',
    ],
  },
  {
    name: 'Australia',
    code: 'AU',
    cities: [
      'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
      'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Geelong',
      'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba',
      'Ballarat', 'Bendigo', 'Launceston', 'Mackay', 'Rockhampton',
    ],
  },
  {
    name: 'Japan',
    code: 'JP',
    cities: [
      'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo',
      'Fukuoka', 'Kawasaki', 'Kobe', 'Kyoto', 'Saitama',
      'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai',
      'Niigata', 'Hamamatsu', 'Sagamihara', 'Kumamoto', 'Okayama',
    ],
  },
  {
    name: 'China',
    code: 'CN',
    cities: [
      'Shanghai', 'Beijing', 'Chongqing', 'Guangzhou', 'Shenzhen',
      'Tianjin', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing',
      "Xi'an", 'Hangzhou', 'Shenyang', 'Harbin', 'Suzhou',
      'Dalian', 'Qingdao', 'Jinan', 'Zhengzhou', 'Changsha',
    ],
  },
  {
    name: 'India',
    code: 'IN',
    cities: [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
      'Kolkata', 'Ahmedabad', 'Pune', 'Surat', 'Jaipur',
      'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
      'Bhopal', 'Patna', 'Vadodara', 'Coimbatore', 'Agra',
    ],
  },
  {
    name: 'Turkey',
    code: 'TR',
    cities: [
      'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana',
      'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin',
      'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa',
      'Kahramanmaraş', 'Malatya', 'Van', 'Erzurum', 'Trabzon',
    ],
  },
  {
    name: 'Egypt',
    code: 'EG',
    cities: [
      'Cairo', 'Alexandria', 'Giza', 'Shubra el-Kheima', 'Port Said',
      'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta',
      'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan',
      'Damietta', 'Damanhur', 'Minya', 'Beni Suef', 'Qena',
    ],
  },
  {
    name: 'Saudi Arabia',
    code: 'SA',
    cities: [
      'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
      'Khobar', 'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait',
      'Abha', 'Jubail', 'Hafar Al-Batin', 'Najran', 'Al Hufuf',
      'Yanbu', 'Al-Kharj', 'Jizan', 'Hail', 'Sakaka',
    ],
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    cities: [
      'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
      'Fujairah', 'Umm Al Quwain', 'Al Ain', 'Khorfakkan', 'Kalba',
      'Dibba Al Hisn', 'Madinat Zayed', 'Ruwais', 'Ghayathi', 'Liwa',
      'Jebel Ali', 'Hatta', 'Dalma', 'Mirfa', 'Sila',
    ],
  },
  {
    name: 'Mexico',
    code: 'MX',
    cities: [
      'Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Toluca',
      'Tijuana', 'León', 'Juárez', 'Torreón', 'San Luis Potosí',
      'Querétaro', 'Mérida', 'Mexicali', 'Aguascalientes', 'Hermosillo',
      'Saltillo', 'Morelia', 'Culiacán', 'Chihuahua', 'Veracruz',
    ],
  },
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('Seeding locations...');

  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
  await db.delete(cities);
  await db.delete(countries);
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

  for (const country of SEED_DATA) {
    const [inserted] = await db
      .insert(countries)
      .values({ name: country.name, code: country.code })
      .$returningId();

    const countryId = inserted.id;

    await db.insert(cities).values(
      country.cities.map((name) => ({ name, countryId })),
    );

    console.log(`  ✓ ${country.name} (${country.cities.length} cities)`);
  }

  await connection.end();
  console.log(`Done — ${SEED_DATA.length} countries, ${SEED_DATA.reduce((s, c) => s + c.cities.length, 0)} cities.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
