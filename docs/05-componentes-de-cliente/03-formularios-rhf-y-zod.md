---
title: Formularios con React Hook Form y Zod
sidebar_position: 3
description: Esquemas con Zod 4 compartidos entre cliente y servidor, React Hook Form con zodResolver, errores accesibles, campos dinámicos con useFieldArray, componentes de terceros con Controller y envío con useMutation.
---

# Formularios con React Hook Form y Zod

<Tech ids={['reacthookform', 'zod', 'react', 'reactquery', 'shadcnui']} />

<Estado tipo="construye">El formulario del panel para publicar o editar una vivienda: título, tipo, precio, habitaciones, fotos y servicios cercanos (lista dinámica).</Estado>

## Concepto

### Zod: un esquema, tres usos

Zod describe la forma de los datos y **valida en runtime**, y TypeScript infiere el tipo:

```ts
import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().trim().min(10, { error: 'Mínimo 10 caracteres' }).max(120),
  kind: z.enum(['rent', 'sale']),
  // Vacío = "precio a consultar" (distinto de 0, regla de datos de ripopola)
  price: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : Number(v)))
    .pipe(z.number({ error: 'Escribí un número' }).positive({ error: 'El precio tiene que ser mayor que 0' }).optional()),
  bedrooms: z.coerce.number<string>().int().min(0).max(20),
  amenities: z.array(z.object({ name: z.string().min(2), distanceKm: z.coerce.number<string>().min(0) })).max(10),
});

export type ListingInput = z.input<typeof listingSchema>;   // lo que llega del form (strings)
export type ListingOutput = z.output<typeof listingSchema>; // lo validado (numbers)
```

`transform` + `pipe` convierte y vuelve a validar el resultado. El mismo esquema sirve para el formulario (cliente), para la Server Action
(servidor, 8.2) y para validar respuestas. En Zod 4 el mensaje se pasa con
`{ error: '...' }` y `z.coerce` convierte strings de inputs en números.

:::tip ¿Y el DTO de Nest?
Nest valida con `class-validator` en los DTOs. La validación del frontend es
para la experiencia de usuario; **la del backend es la que vale**. Los dos
tienen que estar de acuerdo: si cambia una regla, cambiá ambos (o generá el
esquema Zod desde el OpenAPI con herramientas como Orval).
:::

### React Hook Form

RHF registra inputs **no controlados** (refs) y solo re-renderiza lo que hace
falta. Es rápido incluso con formularios enormes.

```tsx
const form = useForm<ListingInput, unknown, ListingOutput>({
  resolver: zodResolver(listingSchema),
  defaultValues: { title: '', kind: 'rent', price: '', bedrooms: '1', amenities: [] },
  mode: 'onTouched', // valida al salir del campo y después en cada cambio
});
```

| API | Para |
| --- | --- |
| `register('title')` | Conecta un input nativo (name, ref, onChange, onBlur). |
| `formState.errors` | Errores por campo. |
| `formState.isSubmitting` / `isDirty` | Enviando / hubo cambios. |
| `handleSubmit(onValid)` | Valida y, si está bien, llama con los datos de salida. |
| `useFieldArray` | Listas de campos que se agregan y quitan. |
| `Controller` / `useController` | Componentes que no son inputs nativos (select de Radix, mapa). |
| `useWatch` | Observar un campo para mostrar algo condicional. |
| `setError` | Poner errores que vienen del servidor. |
| `reset(values)` | Cargar datos (editar) o limpiar. |

## Si venís de Angular

<Angular>

| Angular | React Hook Form + Zod |
| --- | --- |
| `FormGroup` / `FormControl` / Signal Forms `form()` | `useForm` |
| `Validators.required`, `minLength` | El esquema de Zod |
| `formControlName="title"` | `{...register('title')}` |
| `FormArray` | `useFieldArray` |
| `ControlValueAccessor` para un componente propio | `Controller` / `useController` |
| `control.errors?.['minlength']` | `errors.title?.message` |
| `form.valueChanges` | `useWatch` / `watch` |
| `form.markAllAsTouched()` al enviar | `handleSubmit` valida todo |

La idea de un esquema único validado en cliente y servidor es lo que más se
parece a compartir validadores en una librería del monorepo.

</Angular>

## En ripopola: publicar una vivienda

```bash
pnpm add -E react-hook-form zod @hookform/resolvers
cd apps/web && pnpm dlx shadcn@latest add form select textarea
```

El esquema va en `apps/panel/features/listings/listing-schema.ts` (el de
arriba). El formulario:

```tsx title="apps/panel/features/listings/listing-form.tsx"
'use client';

import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { listingSchema, type ListingInput, type ListingOutput } from './listing-schema';
import { createListing } from './api-browser';
import { ApiValidationError } from '@ripopola/frontend-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ListingForm({ townId, onCreated }: { townId: string; onCreated: (id: string) => void }) {
  const {
    register, control, handleSubmit, setError,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput, unknown, ListingOutput>({
    resolver: zodResolver(listingSchema),
    defaultValues: { title: '', kind: 'rent', price: '', bedrooms: '1', amenities: [] },
    mode: 'onTouched',
  });
  const amenities = useFieldArray({ control, name: 'amenities' });

  const mutation = useMutation({
    mutationFn: (data: ListingOutput) => createListing(townId, data),
    onSuccess: (listing) => onCreated(listing.id),
    onError: (err) => {
      // Errores de validación del servidor (400 de Nest) a cada campo
      if (err instanceof ApiValidationError) {
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          setError(field as keyof ListingInput, { message: messages[0] });
        }
      } else setError('root', { message: 'No pudimos guardar. Probá de nuevo.' });
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutateAsync(data))} noValidate className="space-y-4">
      <Field label="Título" error={errors.title?.message} id="title">
        <input id="title" {...register('title')} aria-invalid={!!errors.title} aria-describedby="title-error" />
      </Field>

      <Field label="Tipo" error={errors.kind?.message} id="kind">
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Alquiler</SelectItem>
                <SelectItem value="sale">Venta</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field label="Precio (€)" error={errors.price?.message} id="price">
        <input id="price" inputMode="decimal" {...register('price')} aria-invalid={!!errors.price} aria-describedby="price-error" />
      </Field>

      <fieldset>
        <legend>Servicios cercanos</legend>
        {amenities.fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">  {/* f.id lo genera RHF: no uses el índice */}
            <input aria-label={`Servicio ${i + 1}`} {...register(`amenities.${i}.name`)} />
            <input aria-label={`Distancia ${i + 1} en km`} inputMode="decimal" {...register(`amenities.${i}.distanceKm`)} />
            <button type="button" onClick={() => amenities.remove(i)}>Quitar</button>
          </div>
        ))}
        <button type="button" onClick={() => amenities.append({ name: '', distanceKm: '0' })}>Agregar servicio</button>
      </fieldset>

      {errors.root && <p role="alert">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Publicando…' : 'Publicar vivienda'}</button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
```

Qué hace cada parte:
- `handleSubmit` valida con Zod; si falla, pone el foco en el primer campo con
  error (`shouldFocusError` viene activado).
- `isSubmitting` queda en `true` mientras la promesa de `mutateAsync` no termina.
- Los errores del backend (Nest devuelve 400 con los campos) se mapean con `setError`.
- `ApiValidationError` es una subclase de `ApiError` (4.1) que expone `fieldErrors` (campo → mensajes) del Problem Details del 400.

### Editar: cargar valores

```tsx
useForm({ defaultValues: toFormValues(listing) });
// o, si los datos llegan después:
useEffect(() => { if (listing) reset(toFormValues(listing)); }, [listing, reset]);
```

Mejor todavía: renderizá el form **cuando ya tenés los datos** (Suspense o
`if (!listing) return`) y pasalos como `defaultValues`, con `key={listing.id}` (1.7).

<Alternativa title="Formik, TanStack Form y Server Actions sin librería">
**Formik** fue el estándar antes de RHF (controlado, más lento); lo vas a ver en
código viejo. **TanStack Form** es más nuevo, muy tipado y agnóstico de framework.
Para formularios simples, una **Server Action con `useActionState`** y Zod en el
servidor alcanza sin librería (8.2).
</Alternativa>

## Errores comunes

- **Usar el índice como key** en `useFieldArray`: usá `field.id`.
- **Inputs numéricos sin `coerce`**: llegan como string y Zod falla.
- **Tipar `useForm` solo con la salida** del esquema cuando hay `coerce`: usá los tres genéricos (entrada, contexto, salida).
- **Validar solo en el cliente.**
- **Controlar cada input con `useState`** en un form de 20 campos.

<Resumen>

- Zod: un esquema que valida en runtime e infiere tipos; se comparte cliente y servidor.
- RHF: inputs no controlados, re-renders mínimos, `zodResolver`.
- `useFieldArray` para listas; `Controller` para componentes no nativos.
- Errores del servidor con `setError`; envío con `useMutation`.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué React Hook Form es más rápido que un formulario controlado?**
Porque registra inputs no controlados con refs y no re-renderiza el formulario
en cada tecla; solo actualiza lo que se suscribe a cambios.

**2. ¿Qué ventaja tiene Zod frente a validar con funciones sueltas?**
Un solo esquema declara la forma, valida en runtime e infiere el tipo de
TypeScript, y se puede reutilizar en cliente y servidor.

**3. ¿Cómo mostrás errores de validación que vienen del backend?**
Mapeando la respuesta del servidor a cada campo con `setError`, y un error
general en `root` para lo que no es de un campo.

**4. ¿Cómo integrás un componente que no es un input nativo?**
Con `Controller` o `useController`, que le pasa `value` y `onChange` y lo
registra en el formulario.

**5. ¿Alcanza con validar en el frontend?**
No. El frontend valida para la experiencia; el backend tiene que validar
siempre porque cualquier cliente puede saltearse el formulario.

## Glosario

| Término | Qué es |
| --- | --- |
| Esquema | Descripción de la forma y reglas de los datos. |
| Resolver | Adaptador que conecta un validador (Zod) con RHF. |
| `coerce` | Convertir el tipo antes de validar (string a número). |
| Field array | Lista dinámica de grupos de campos. |
