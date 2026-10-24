---
title: Mathematical Tricks
cdate: 2026-01-05
mdate: 2026-01-05T10:56
date: Last Modified
tags:
---
**Check if solution exist:**
Lets say there is a function:
$$y = f(a,x)$$
where $x,y$ are independent variables, and $a$ is some constant. So to check if solution $x = f^{-1}(a,y)$ exist. Few things can be checked:
1. Continuity for all $x$
2. Boundary values of $f$
3. Monotonic decreasing (first derivative negative).

It is generalised but a classic example here is *Regularised Gamma function ($\Gamma$)* where for equation $x =  \Gamma(a,y)$, a unique solution exist: $y = \Gamma^{-1}(a,x)$. 

> The closed form solution can not be obtained but one can check the above mentioned conditions that a unique solution does exist, and only can be derived from numerics.[^1]


References:
[^1]: *Flow Control of A + B → C Fronts by Radial Injection*, Fabian Brau, G. Schuszter, A. De Wit, 2017, [Link](brauFlowControlFronts2017), [DOI](10.1103/PhysRevLett.118.134101)