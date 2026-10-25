import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChildCard } from '../components/ChildCard'
import { Logo, Plant } from '../components/Plant'
import { useChildren } from '../data/children'
import { currentClinic, currentUser } from '../data/session'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Home() {
  const children = useChildren()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const visible = q ? children.filter((c) => c.nickname.toLowerCase().includes(q)) : children

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <Logo size={34} />
          <span>
            ABA<b>Flower</b>
          </span>
        </div>
        <span className="muted small">{currentClinic.name}</span>
      </header>

      <section className="hello">
        <p className="muted">
          {greeting()}, {currentUser.name}
        </p>
        <h1>Seu jardim</h1>
        <p className="muted small">
          {children.length === 0
            ? 'Nenhuma criança ainda'
            : `${children.length} ${children.length === 1 ? 'criança' : 'crianças'} em acompanhamento`}
        </p>
      </section>

      {children.length === 0 ? (
        <div className="empty">
          <Plant stage="semente" color="rosa" size={120} />
          <h2>Plante a primeira semente</h2>
          <p className="muted">
            Cadastre uma criança para começar a trilha, da adaptação até a reavaliação.
          </p>
          <Link to="/criancas/nova" className="btn btn--primary btn--lg">
            <span aria-hidden="true">+</span> Plantar primeira semente
          </Link>
        </div>
      ) : (
        <>
          {children.length > 4 && (
            <input
              className="input search"
              type="search"
              placeholder="Buscar por apelido"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <ul className="list">
            {visible.map((c, i) => (
              <li key={c.id} style={{ ["--i" as string]: i }}>
                <ChildCard child={c} />
              </li>
            ))}
          </ul>
          {visible.length === 0 && <p className="muted center">Nenhuma criança com esse apelido.</p>}
          <Link to="/criancas/nova" className="fab">
            <span aria-hidden="true">+</span> Acolher criança
          </Link>
        </>
      )}
    </div>
  )
}
