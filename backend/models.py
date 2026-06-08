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
    nome = db.Column(db.String(50), nullable=False) # Ex: "Nubank", "Caixa", "Carteira"
    cor = db.Column(db.String(7), nullable=False, default="#4A5980") # Ex: "#8A05BE"
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime, nullable=True) # Soft delete para não quebrar transações antigas
    
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

    # Relacionamentos
    account = db.relationship('Account', backref='transactions')
    category = db.relationship('Category', backref='transactions')
    
    # 1. A Direção do Dinheiro (NOVO)
    tipo = db.Column(db.String(20), nullable=False) # 'receita' ou 'despesa'
    
    descricao = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    pago = db.Column(db.Boolean, default=False)
    
    # 2. A Inteligência de Orçamento (NOVO)
    natureza = db.Column(db.String(20), default='variavel') # 'fixa' ou 'variavel'
    
    # 3. Inteligência de Parcelamentos e Lançamentos
    tipo_lancamento = db.Column(db.String(50), default='unico') # 'unico', 'recorrente', 'parcelado'
    grupo_parcelamento_id = db.Column(db.String(36), nullable=True) 
    parcela_atual = db.Column(db.Integer, nullable=True)
    total_parcelas = db.Column(db.Integer, nullable=True)
    
    # Auditoria e Segurança
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime, nullable=True) # Soft delete

# Índices para performance no PostgreSQL
db.Index('idx_transaction_user_date', Transaction.user_id, Transaction.data_vencimento)
db.Index('idx_transaction_account', Transaction.account_id)