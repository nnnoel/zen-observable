const Observable = require('../src/Observable');
const assert = require('assert');

describe('from', () => {
  const observableSymbol = Symbol.observable || '@@observable';

  const iterable = {
    *[Symbol.iterator]() {
      yield 1;
      yield 2;
      yield 3;
    },
  };

  it('throws if the argument is null', () => {
    assert.throws(() => Observable.from(null));
  });

  it('throws if the argument is undefined', () => {
    assert.throws(() => Observable.from(undefined));
  });

  it('throws if the argument is not observable or iterable', () => {
    assert.throws(() => Observable.from({}));
  });

  describe('observables', () => {
    it('returns the input if the constructor matches "this"', () => {
      let ctor = function() {};
      let observable = new Observable(() => {});
      observable.constructor = ctor;
      assert.equal(Observable.from.call(ctor, observable), observable);
    });

    it('throws if @@observable property is not a method', () => {
      assert.throws(() => Observable.from({
        [observableSymbol]: 1
      }));
    });

    it('returns an observable wrapping @@observable result', () => {
      let inner = {
        subscribe(x) {
          observer = x;
          return () => { cleanupCalled = true };
        },
      };
      let observer;
      let cleanupCalled = true;
      let observable = Observable.from({
        [observableSymbol]() { return inner },
      });
      observable.subscribe();
      assert.equal(typeof observer.next, 'function');
      observer.complete();
      assert.equal(cleanupCalled, true);
    });
  });

  describe('iterables', () => {
    it('throws if @@iterator is not a method', () => {
      assert.throws(() => Observable.from({ [Symbol.iterator]: 1 }));
    });

    it('returns an observable wrapping iterables', async () => {
      let calls = [];
      let subscription = Observable.from(iterable).subscribe({
        next(v) { calls.push(['next', v]) },
        complete() { calls.push(['complete']) },
      });
      assert.deepEqual(calls, []);
      await null;
      assert.deepEqual(calls, [
        ['next', 1],
        ['next', 2],
        ['next', 3],
        ['complete'],
      ]);
    });
  });
});
