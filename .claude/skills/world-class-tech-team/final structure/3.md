Başlamadan əvvəl hər dəyişiklik üçün aşağıdakı protokol məcburidir:

---

## NO DATA LOSS — İŞ PROTOKOLU

### Hər DB dəyişikliyindən ƏVVƏL
- `pg_dump` backup al — Supabase Dashboard → Backups, yaxud `pg_dump` CLI
- Backup-ı lokal saxla + tarix qoy

### Kod dəyişiklikləri qaydası

**Cədvəl/sütun silmə — QADAĞANDIR**
```sql
-- ❌ HEÇ VAXT:
DROP TABLE hesab_fakturalar;
DROP COLUMN assignee_id;

-- ✅ ƏVƏZINƏ:
ALTER TABLE hesab_fakturalar RENAME TO _archived_hesab_fakturalar_2026;
ALTER TABLE tasks ADD COLUMN _deprecated_assignee_id text;  -- köhnə datanı köçür, sonra gizlət
```

**Yeni funksionallıq — paralel əlavə et**
```sql
-- Köhnə cədvəl toxunulmur
-- Yeni cədvəl paralel yaradılır
-- Birləşdirici VIEW yaradılır
-- Kod yalnız VIEW-dan oxuyur
```

**Miqrasiya strukturu**
```js
// up() + down() HƏR ZAMAN məcburidir
export const up = async () => { /* dəyiş */ }
export const down = async () => { /* geri qaytar */ }
```

### Hər deploy-dan ƏVVƏL — Parity Test
```sql
-- Köhnə vs yeni cədvəl eyni datanı verir?
SELECT COUNT(*), SUM(amount) FROM köhnə_cədvəl;
SELECT COUNT(*), SUM(amount) FROM yeni_view;
-- Fərq varsa → deploy bloklanır
```

### Vizual Audit (hər yeni/dəyişdirilmiş səhifə üçün)
- ☐ Bütün köhnə qeydlər görünür?
- ☐ Bütün filtrlər işləyir?
- ☐ Hər köhnə qeyd detail açılır?
- ☐ Before/after screenshot cütü

### Nav-dan silmə ≠ datanı silmə
- `HesabFakturalarPage` route-dan çıxır → cədvəl **qalır**
- `Qaynaqlar` nav-dan silinir → cədvəl **qalır**
- `Sənəd Arxivi` nav-dan silinir → data `project_documents`-a köçürülür, köhnə cədvəl **qalır**

---

Bu protokol hər tapşırıqda tətbiq olunur. İndi başlayırıq.
