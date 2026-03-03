const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, clientId, guildIds } = require('./config.json');

const commands = [
  new SlashCommandBuilder()
    .setName('ficha')
    .setDescription('Crear tu ficha de rol')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registrando comandos en múltiples servidores...');

    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Comando /ficha registrado en servidor ${guildId}`);
    }

    console.log('Registro completado.');
  } catch (error) {
    console.error(error);
  }
})();
