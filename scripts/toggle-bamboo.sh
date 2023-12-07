#!/bin/bash
current_engine=$(ibus engine)

bamboo="Bamboo"
bamboo_us="BambooUs"

if [[ "$current_engine" == "$bamboo" ]]; then
	ibus engine $bamboo_us
else
	ibus engine $bamboo
fi

# ibus engine Bamboo
# ibus engine BambooUs
