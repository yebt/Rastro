import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { $curExercise, $curSets, $repCount } from '../stores/session';
import ExercisesTab from './ExercisesTab.vue';

beforeEach(() => {
  $curSets.set([]);
  $repCount.set(8);
  $curExercise.set('dominadas');
});

describe('ExercisesTab', () => {
  it('renders the session card and the four exercise chips', () => {
    const wrapper = mount(ExercisesTab, { props: { active: true } });
    expect(wrapper.text()).toContain('Nueva sesión');
    expect(wrapper.text()).toContain('Total histórico');
    for (const label of ['Dominadas', 'Burpees', 'Abdominales', 'Flexiones']) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it('selects an exercise via its chip', async () => {
    const wrapper = mount(ExercisesTab, { props: { active: true } });
    const burpees = wrapper.findAll('.fchip').find((b) => b.text() === 'Burpees');
    await burpees?.trigger('click');
    expect($curExercise.get()).toBe('burpees');
  });

  it('increments and decrements reps via the stepper', async () => {
    const wrapper = mount(ExercisesTab, { props: { active: true } });
    await wrapper.get('button[aria-label="Sumar"]').trigger('click');
    expect($repCount.get()).toBe(9);
    await wrapper.get('button[aria-label="Restar"]').trigger('click');
    await wrapper.get('button[aria-label="Restar"]').trigger('click');
    expect($repCount.get()).toBe(7);
  });

  it('adds a set and shows the save button', async () => {
    const wrapper = mount(ExercisesTab, { props: { active: true } });
    expect(wrapper.text()).not.toContain('Guardar sesión');
    await wrapper.get('.btn-go.wide').trigger('click'); // "Agregar serie"
    expect($curSets.get()).toEqual([8]);
    expect(wrapper.text()).toContain('Guardar sesión');
  });
});
