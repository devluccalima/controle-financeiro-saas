import uuid
from datetime import datetime, timezone
from database import db

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Auditoria
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Account(db.Model):
    __tablename__ = 'accounts'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False) # corrente, credito, carteira
    dia_fechamento = db.Column(db.Integer, nullable=True) # Para cartões
    dia_vencimento = db.Column(db.Integer, nullable=True) # Para cartões
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime, nullable=True) # Soft delete

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    nome = db.Column(db.String(50), nullable=False)
    tipo = db.Column(db.String(20), nullable=False) # receita, despesa
    cor = db.Column(db.String(7), nullable=True) # Ex: #FF5733
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime, nullable=True)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False)
    
    descricao = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    pago = db.Column(db.Boolean, default=False)
    
    # Inteligência de Parcelamentos e Lançamentos Fixos
    tipo_lancamento = db.Column(db.String(50), default='unico') # unico, fixo, parcelado
    grupo_parcelamento_id = db.Column(db.String(36), nullable=True) # Une todas as parcelas de uma mesma compra
    parcela_atual = db.Column(db.Integer, nullable=True)
    total_parcelas = db.Column(db.Integer, nullable=True)
    
    # Auditoria e Segurança
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime, nullable=True) # Soft delete

# Índices para performance no PostgreSQL (Aceleram as buscas do Dashboard)
db.Index('idx_transaction_user_date', Transaction.user_id, Transaction.data_vencimento)
db.Index('idx_transaction_account', Transaction.account_id)