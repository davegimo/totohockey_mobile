create or replace view public.vista_giocatori as
select
  p.id as id_giocatore,
  p.nome,
  p.cognome,
  p.email,
  count(
    case
      when pr.pronostico_casa = pa.risultato_casa
      and pr.pronostico_ospite = pa.risultato_ospite then 1
      else null::integer
    end
  ) as risultati_esatti,
  count(
    case
      when (pr.pronostico_casa > pr.pronostico_ospite
      and pa.risultato_casa > pa.risultato_ospite
      or pr.pronostico_casa = pr.pronostico_ospite
      and pa.risultato_casa = pa.risultato_ospite
      or pr.pronostico_casa < pr.pronostico_ospite
      and pa.risultato_casa < pa.risultato_ospite)
      -- Escludiamo i risultati esatti
      and not (pr.pronostico_casa = pa.risultato_casa
      and pr.pronostico_ospite = pa.risultato_ospite) then 1
      else null::integer
    end
  ) as esiti_presi,
  COALESCE(sum(pr.punti), 0::bigint) as punti_totali
from
  profiles p
  left join pronostici pr on p.id = pr.user_id
  left join partite pa on pr.partita_id = pa.id
group by
  p.id,
  p.nome,
  p.cognome,
  p.email
order by
  (COALESCE(sum(pr.punti), 0::bigint)) desc,
  (
    count(
      case
        when pr.pronostico_casa = pa.risultato_casa
        and pr.pronostico_ospite = pa.risultato_ospite then 1
        else null::integer
      end
    )
  ) desc,
  (
    count(
      case
        when (pr.pronostico_casa > pr.pronostico_ospite
        and pa.risultato_casa > pa.risultato_ospite
        or pr.pronostico_casa = pr.pronostico_ospite
        and pa.risultato_casa = pa.risultato_ospite
        or pr.pronostico_casa < pr.pronostico_ospite
        and pa.risultato_casa < pa.risultato_ospite)
        -- Escludiamo i risultati esatti anche nell'ordinamento
        and not (pr.pronostico_casa = pa.risultato_casa
        and pr.pronostico_ospite = pa.risultato_ospite) then 1
        else null::integer
      end
    )
  ) desc; 