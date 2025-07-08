import asyncio
import json
import os
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

users_FILE = os.path.join(os.path.dirname(__file__), "users.json")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

#cache
users = set()

#load users
def load_users():
    global users
    if os.path.exists(users_FILE):
        with open(users_FILE, "r") as f:
            users = set(json.load(f))

#save users
def save_users():
    with open(users_FILE, "w") as f:
        json.dump(list(users), f)

#new chat with bot
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    users.add(chat_id)
    save_users()
    await context.bot.send_message(chat_id=chat_id, text="Subscribed! I’ll notify you when your server is online.")

async def notify_all(message: str):
    for chat_id in users:
        try:
            await application.bot.send_message(chat_id=chat_id, text=message)
        except Exception as e:
            print(f"Failed to send to {chat_id}: {e}")

async def run_bot():
    global application
    load_users()
    application = ApplicationBuilder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    print("Telegram bot is running...")
    await application.run_polling()
