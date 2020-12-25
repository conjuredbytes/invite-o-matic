const Discord = require('discord.js');
const sgMail = require('@sendgrid/mail');
const config = require('./config.json');
const client = new Discord.Client();

function acceptApplication(email, isAccepted) {

    const listenChannel = client.channels.get(config.listenChannel);
    const inviteChannel = client.channels.get(config.inviteChannel);

    if (isAccepted) {
        inviteChannel.createInvite({maxUses: 1, maxAge: 0, unique: true})
            .then((invite) => {
                const msg = {
                    to: email,
                    from: config.fromAddress,
                    templateId: config.acceptTemplateId,
                    dynamic_template_data: {
                        personalDiscordInviteLink: invite.url
                    }
                }

                sgMail.send(msg)
                    .then(() => {
                        listenChannel.send(`Accepted ${email}, their email has been sent.`);
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }
    else {
        const msg = {
            to: email,
            from: config.fromAddress,
            templateId: config.rejectTemplateId,
        }

        sgMail.send(msg)
            .then(() => {
                listenChannel.send(`Rejected ${email}, their email has been sent.`);
            })
            .catch(console.error);
    }
}

client.login(config.discordApiKey);
sgMail.setApiKey(config.sendgridApiKey);

client.on('ready', () => {
    console.log(`Bot is online`);
});

client.on('message', (message) => {
    if (message.channel.id === config.listenChannel) {

      if (message.content.startsWith(config.prefix))  {
            const args = message.content.slice(config.prefix.length).split(/ +/);
            const command = args.shift().toLowerCase();

            if (!args.length) {
                return message.channel.send(`${message.author}, you didn't supply a command. Use ${config.prefix}help for a list of available commands.`);
            }

            switch (command) {
                case 'accept':
                    acceptApplication(args[0], true);
                    break;
                case 'reject':
                    acceptApplication(args[0], false);
                    break;
                case 'help':
                    return message.channel.send(`${message.author}, the available commands are: \n
                     **${config.prefix}accept:** Send an acceptance email to the provided email address. \n
                     **${config.prefix}reject:** Send a rejection email to the provided email address. \n 
                     **${config.prefix}help:** List available commands and their usage.`);
                default:
                    return message.channel.send(`${message.author}, ${command} isn't a supported command. Use ${config.prefix}help to list available commands.`);
            }
        }
    }
});
