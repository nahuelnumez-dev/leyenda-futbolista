/**
 * Nombres para personas ficticias (entrenadores, compañeros, agentes, periodistas), por idioma.
 * Las combinaciones se generan con la semilla; no corresponden a personas reales.
 */
export interface NamePool {
  first: string[];
  last: string[];
}

export const NAMES: Record<string, NamePool> = {
  es: {
    first: ['Álvaro', 'Rubén', 'Iván', 'Sergio', 'Diego', 'Pablo', 'Javier', 'Marcos', 'Hugo', 'Adrián', 'Raúl', 'Óscar', 'Gonzalo', 'Martín', 'Lucas', 'Nicolás', 'Facundo', 'Santiago', 'Matías', 'Joaquín', 'Ezequiel', 'Leandro', 'Agustín', 'Tomás', 'Bruno', 'Emiliano', 'Rodrigo', 'Ignacio', 'Mario', 'Daniel'],
    last: ['Garrido', 'Montero', 'Salcedo', 'Ferrán', 'Iturbe', 'Olmedo', 'Carrasco', 'Villalba', 'Esquivel', 'Arrieta', 'Bustos', 'Quiroga', 'Domínguez', 'Peralta', 'Sosa', 'Ledesma', 'Aguirre', 'Cabral', 'Benítez', 'Toledo', 'Pizarro', 'Valverde', 'Echeverría', 'Rivas', 'Mansilla', 'Zárate', 'Ocampo', 'Herrera', 'Lombardi', 'Navarro'],
  },
  en: {
    first: ['James', 'Oliver', 'Harry', 'Jack', 'Charlie', 'George', 'Thomas', 'Daniel', 'Ryan', 'Luke', 'Callum', 'Connor', 'Lewis', 'Mason', 'Kieran', 'Sam', 'Ben', 'Joe', 'Jamie', 'Owen'],
    last: ['Whitfield', 'Ashworth', 'Pemberton', 'Haddock', 'Calloway', 'Brennan', 'Fairclough', 'Oakley', 'Thornton', 'Mercer', 'Holloway', 'Kingsley', 'Rowntree', 'Garside', 'Lockwood', 'Prescott', 'Hartley', 'Doyle', 'Spencer', 'Burrows'],
  },
  pt: {
    first: ['João', 'Pedro', 'Gabriel', 'Rafael', 'Lucas', 'Matheus', 'Thiago', 'Bruno', 'Felipe', 'Gustavo', 'Vinícius', 'Caio', 'Diego', 'André', 'Rodrigo', 'Leonardo', 'Renan', 'Igor', 'Murilo', 'Henrique'],
    last: ['Albuquerque', 'Nogueira', 'Barbosa', 'Cavalcanti', 'Figueiredo', 'Moreira', 'Teixeira', 'Rezende', 'Siqueira', 'Pacheco', 'Araújo', 'Medeiros', 'Fontes', 'Bezerra', 'Damasceno', 'Queiroz', 'Valadares', 'Coutinho', 'Peixoto', 'Brandão'],
  },
  it: {
    first: ['Lorenzo', 'Matteo', 'Alessandro', 'Federico', 'Davide', 'Riccardo', 'Simone', 'Andrea', 'Marco', 'Giacomo', 'Nicolò', 'Tommaso', 'Gianluca', 'Stefano', 'Emanuele', 'Filippo', 'Luca', 'Daniele', 'Pietro', 'Edoardo'],
    last: ['Bellandi', 'Ferraresi', 'Montanari', 'Castellani', 'Galimberti', 'Rinaldi', 'Benedetti', 'Ottaviani', 'Lombardo', 'Santoro', 'Fontana', 'Bertolini', 'Mancuso', 'Ricciardi', 'Pellegrini', 'Vitale', 'Bianchetti', 'Sartori', 'Caruso', 'Zanetti'],
  },
  de: {
    first: ['Lukas', 'Jonas', 'Leon', 'Felix', 'Maximilian', 'Niklas', 'Tobias', 'Jannik', 'Florian', 'Moritz', 'Tim', 'Julian', 'Kevin', 'Marvin', 'Dennis', 'Sebastian', 'Fabian', 'Philipp', 'Erik', 'Paul'],
    last: ['Brandt', 'Hoffmeister', 'Kessler', 'Lindner', 'Vogt', 'Engel', 'Hartmann', 'Brückner', 'Seidel', 'Winkler', 'Ackermann', 'Krüger', 'Lehmann', 'Kranz', 'Albrecht', 'Busch', 'Reinhardt', 'Pohl', 'Schäfer', 'Ziegler'],
  },
  fr: {
    first: ['Hugo', 'Théo', 'Lucas', 'Mathis', 'Enzo', 'Maxime', 'Antoine', 'Clément', 'Romain', 'Kylian', 'Nathan', 'Baptiste', 'Julien', 'Florian', 'Yanis', 'Adrien', 'Quentin', 'Bastien', 'Rayan', 'Louis'],
    last: ['Lefebvre', 'Moreau', 'Garnier', 'Chevalier', 'Rousseau', 'Fournier', 'Lambert', 'Girard', 'Bonnet', 'Mercier', 'Dupuis', 'Lemaire', 'Faure', 'Gauthier', 'Perrin', 'Marchand', 'Boyer', 'Renaud', 'Colin', 'Vidal'],
  },
  nl: {
    first: ['Daan', 'Sem', 'Bram', 'Lars', 'Thijs', 'Jesse', 'Ruben', 'Stijn', 'Jasper', 'Niels', 'Teun', 'Sven', 'Milan', 'Joey', 'Koen', 'Wout', 'Luuk', 'Jens', 'Tim', 'Bas'],
    last: ['de Groot', 'van Dijkhuis', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkman', 'Kramer', 'Postma', 'Verbeek'],
  },
  tr: {
    first: ['Emre', 'Burak', 'Mert', 'Kerem', 'Arda', 'Oğuz', 'Can', 'Barış', 'Cenk', 'Hakan', 'Selçuk', 'Yusuf', 'Kaan', 'Onur', 'Furkan', 'Berk', 'Efe', 'Umut', 'Serkan', 'Volkan'],
    last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özdemir', 'Polat', 'Erdem', 'Güler'],
  },
  ja: {
    first: ['Haruto', 'Sota', 'Yuto', 'Ren', 'Kaito', 'Takumi', 'Daiki', 'Riku', 'Kenta', 'Shota', 'Yuma', 'Kosuke', 'Ryota', 'Hiroki', 'Takuya', 'Naoki', 'Yusuke', 'Kazuki', 'Shun', 'Taiga'],
    last: ['Tanaka', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Mori', 'Ikeda', 'Hashimoto'],
  },
  ko: {
    first: ['Min-jun', 'Seo-jun', 'Ji-ho', 'Do-yun', 'Ha-jun', 'Joon-ho', 'Hyun-woo', 'Sung-min', 'Jae-won', 'Tae-yang', 'Woo-jin', 'Dong-hyun', 'Seung-ho', 'Young-jae', 'Ji-sung', 'Kang-in', 'Jun-young', 'Sang-woo', 'Min-ho', 'Jin-woo'],
    last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong'],
  },
  ar: {
    first: ['Abdullah', 'Faisal', 'Saud', 'Fahad', 'Khalid', 'Nawaf', 'Turki', 'Sultan', 'Yasser', 'Majed', 'Salem', 'Hamad', 'Omar', 'Ali', 'Mohammed', 'Abdulrahman', 'Talal', 'Bandar', 'Rayan', 'Ziyad'],
    last: ['Al-Harbi', 'Al-Otaibi', 'Al-Qahtani', 'Al-Ghamdi', 'Al-Zahrani', 'Al-Shehri', 'Al-Dosari', 'Al-Mutairi', 'Al-Anazi', 'Al-Shamrani', 'Al-Malki', 'Al-Subaie', 'Al-Juhani', 'Al-Faraj', 'Al-Hamdan', 'Al-Amri', 'Al-Buraikan', 'Al-Saleh', 'Al-Khaibari', 'Al-Shahrani'],
  },
};

/** Apodos para compañeros (se usan en algunos eventos). */
export const TEAMMATE_NICKNAMES = ['el Toro', 'el Mago', 'el Flaco', 'el Pelado', 'el Tanque', 'el Ruso', 'el Chino', 'el Turco', 'el Indio', 'el Muñeco'];
